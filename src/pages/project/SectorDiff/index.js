import React from "react";
import withRouter from "../../../withRouter";
import axios from "axios";
import Layout from "../../../components/LayoutNew";
import { Row, Col, Select, Alert, Tag } from "antd";
import config from "../../../config";
import history from "../../../history";
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
import PageContent from "../../../components/PageContent";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";

import _ from "lodash";

class SectorDiff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      error: null,
      loading: true,
      selectedAttempt1: 0,
      selectedAttempt2: 0,
      maxAttempt: 0
    };
  }

  componentDidMount = () => {
    let query = _.get(this.props, "location.search");
    const {
      match: {
        params: { sectorKey, projectKey }
      }
    } = this.props;

    axios(
      `${config.dataApi}dataset/${projectKey}/sector/sync?sectorKey=${sectorKey}&state=finished&limit=1`
    )
      .then(res => {
        this.setState({ maxAttempt: _.get(res, 'data.result[0].attempt') })
      })
    this.getData(query);
  };


  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "location.search") !==
      _.get(this.props, "location.search")
    ) {
      this.getData(_.get(this.props, "location.search"));
    }
  }
  getData = query => {
    const {
      match: {
        params: { sectorKey, projectKey }
      }
    } = this.props;
    const params = qs.parse(_.get(this.props, "location.search"));
    const splittedAttempts = params.attempts ? params.attempts.split('..') : null;
    const selectedAttempt1 = splittedAttempts ? splittedAttempts[0] : null;
    const selectedAttempt2 = splittedAttempts ? splittedAttempts[1] : null;
    axios(
      `${config.dataApi
      }dataset/${projectKey}/sector/${sectorKey}/diff${query}`
    )
      .then(res => {
        this.setState({
          loading: false,
          data: res.data,
          error: null,
          selectedAttempt1: Number(selectedAttempt1),
          selectedAttempt2: Number(selectedAttempt2)
        });
      })
      .catch(err => {
        this.setState({
          loading: false,
          error: err,
          data: null
        });
      });
  };

  changeAttempt = () => { };

  render = () => {
    //const diff = _.get(this.state, "data.diff");
    const diff = _.get(this.state, "data");
    const {
      match: {
        params: { sectorKey }
      },
      catalogue,
      projectKey
    } = this.props;

    const { error, maxAttempt, selectedAttempt1, selectedAttempt2 } = this.state;

    let html;
    if (diff) {
      try {
        html = Diff2Html.getPrettyHtml(diff, {
          inputFormat: "diff",
          showFiles: false,
          matching: "lines",
          outputFormat: "side-by-side"
        });
      } catch (error) {
        this.setState({ parsingError: error });
      }
    }

    return (
      <Layout
        selectedKeys={["sectorDiff"]}
        openKeys={["assembly"]}
        selectedSector={sectorKey}
        title={catalogue.title}
      >
        <PageContent>

          <Row style={{ marginBottom: '8px' }}>
            <Col span={12}>
              <Select
                value={_.get(this.state, "selectedAttempt1")}
                style={{ width: 120 }}
                onChange={value => {
                  this.setState({ selectedAttempt1: value });

                  history.push({
                    pathname: `/project/${projectKey}/sync/${sectorKey}/diff`,
                    search: `?attempts=${value}..${selectedAttempt2}`
                  });
                }}
                showSearch
                options={[...Array(_.get(this.state, "selectedAttempt2")).keys()].filter(i => i > 0).reverse().map(i => ({ value: i, label: `Attempt: ${i}` }))}
              />
            </Col>
            <Col span={6}>
              <Select
                value={_.get(this.state, "selectedAttempt2")}
                style={{ width: 120 }}
                onChange={value => {
                  this.setState({ selectedAttempt2: value });
                  history.push({
                    pathname: `/project/${projectKey}/sync/${sectorKey}/diff`,
                    search: `?attempts=${selectedAttempt1}..${value}`
                  });
                }}
                showSearch
                options={[...Array(maxAttempt + 1).keys()].reverse().filter(i => i > selectedAttempt1).map(i => ({ value: i, label: `Attempt: ${i}` }))}
              />
            </Col>
            {_.get(this.state, 'data.summary') && <Col span={6}>
              {!isNaN(_.get(this.state, 'data.summary.DELETE')) && <Tag color="red">Deleted: {_.get(this.state, 'data.summary.DELETE')}</Tag>}
              {!isNaN(_.get(this.state, 'data.summary.INSERT')) && <Tag color="green">Inserted: {_.get(this.state, 'data.summary.INSERT')}</Tag>}
            </Col>}
          </Row>
          {error && (
            <Row style={{ marginBottom: '8px' }}>
              <Alert type="error" description={<ErrorMsg error={error} />} />
            </Row>
          )}
          {html && <div dangerouslySetInnerHTML={{ __html: html }} />}

          {_.get(this.state, 'data.identical') && <Row style={{ marginBottom: '8px' }}>
            <Alert title="No diff between sync attempts" />
          </Row>}

        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ projectKey, catalogue }) => ({ projectKey, catalogue });

export default withRouter(withContext(mapContextToProps)(SectorDiff));
