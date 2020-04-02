import React from "react";
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

const { Option } = Select;

const { MANAGEMENT_CLASSIFICATION } = config;

const _ = require("lodash");

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
    // assembly/3/sync?datasetKey=211&state=finished
    const {
        match: {
          params: { sectorKey, catalogueKey }
        }
      } = this.props;

    axios(
        `${
          config.dataApi
        }assembly/${catalogueKey}/sync?sectorKey=${sectorKey}&state=finished&limit=1`
      )
        .then(res => {
            this.setState({maxAttempt: _.get(res, 'data.result[0].attempt') })
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
        params: { sectorKey, catalogueKey }
      }
    } = this.props;
    axios(
      `${
        config.dataApi
      }sector/${sectorKey}/treediff${query}`
    )
      .then(res => {
        this.setState({
          loading: false,
          data: res.data,
          error: null,
          selectedAttempt1: _.get(res, "data.attempt1"),
          selectedAttempt2: _.get(res, "data.attempt2")
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

  changeAttempt = () => {};

  render() {
    const diff = _.get(this.state, "data.diff");
    const {
      match: {
        params: { sectorKey }
      },
      catalogue,
      catalogueKey
    } = this.props;

    const { error, maxAttempt } = this.state;

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
        openKeys={["assembly", "projectDetails"]}
        selectedSector={sectorKey}
        title={catalogue.title}
      >
        <PageContent>
          
          <Row style={{marginBottom: '8px'}}>
            <Col span={12}>
              <Select
                value={_.get(this.state, "selectedAttempt1")}
                style={{ width: 120 }}
                onChange={value => {
                  this.setState({ selectedAttempt1: value });

                  history.push({
                    pathname: `/catalogue/${catalogueKey}/sync/${sectorKey}/diff`,
                    search: `?attempts=${value}..${_.get(
                      this.state,
                      "selectedAttempt2"
                    )}`
                  });
                }}
              >
                {[...Array(_.get(this.state, "selectedAttempt2")).keys()].reverse().map(i => (
                  <Option value={i}>Attempt: {i}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                value={_.get(this.state, "selectedAttempt2")}
                style={{ width: 120 }}
                onChange={value => {
                  this.setState({ selectedAttempt2: value });
                  history.push({
                    pathname: `/catalogue/${catalogueKey}/sync/${sectorKey}/diff`,
                    search: `?attempts=${_.get(
                      this.state,
                      "selectedAttempt1"
                    )}..${value}`
                  });
                }}
              >
                {[...Array(maxAttempt +1).keys()].reverse().map(i => (
                  <Option value={i}>Attempt: {i}</Option>
                ))}
              </Select>
            </Col>
            { _.get(this.state, 'data.summary') && <Col span={6}>
                  { !isNaN( _.get(this.state, 'data.summary.DELETE')) && <Tag color="red">Deleted: { _.get(this.state, 'data.summary.DELETE')}</Tag> }
                  { !isNaN( _.get(this.state, 'data.summary.INSERT')) && <Tag color="green">Inserted: { _.get(this.state, 'data.summary.INSERT')}</Tag>}
            </Col>}
          </Row>
          {error && (
            <Row style={{marginBottom: '8px'}}>
              <Alert type="error" message={<ErrorMsg error={error} />} />
            </Row>
          )}
          {html && <div dangerouslySetInnerHTML={{ __html: html }} />}

            {_.get(this.state, 'data.identical') && <Row style={{marginBottom: '8px'}}>
              <Alert message="No diff between sync attempts" />
            </Row>}

        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogueKey, catalogue }) => ({ catalogueKey, catalogue });

export default withContext(mapContextToProps)(SectorDiff);
