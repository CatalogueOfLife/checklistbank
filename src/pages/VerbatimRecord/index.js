import React from "react";
import config from "../../config";
import axios from "axios";
import { withRouter } from "react-router-dom";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import qs from "query-string";
import _ from "lodash";
import { Alert, Row, Col, Pagination, Spin } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import SearchBox from "../DatasetList/SearchBox";
import history from "../../history";
import MultiValueFilter from "../NameSearch/MultiValueFilter";

const removeEmptyValues = (obj) => {
  return Object.entries(obj).reduce(
    (a, [k, v]) => (v ? { ...a, [k]: v } : a),
    {}
  );
};

class VerbatimRecord extends React.Component {
  constructor(props) {
    super(props);
    const lsLimit = localStorage.getItem("col_plus_verbatim_limit");

    this.state = {
      verbatim: [],
      verbatimError: null,
      total: 0,
      limit: 50, // lsLimit ? Number(lsLimit) : 10,
      offset: 0,
      loading: false,
      issues: []
    };
  }

  componentDidMount = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (!params.limit) {
      params.limit = this.state.limit;
    }
    this.getIssues()
    this.getVerbatimData(params);
  };

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "match.params.key") !==
      _.get(this.props, "match.params.key")
    ) {
      const lsLimit = localStorage.getItem("col_plus_verbatim_limit");

      this.setState({
        verbatim: [],
        verbatimError: null,
        total: 0,
        limit: lsLimit ? Number(lsLimit) : 10,
        offset: 0,
      });
      this.getVerbatimData({});
    } else if (
      _.get(this.props, "location.search") !==
      _.get(prevProps, "location.search")
    ) {
      let params = qs.parse(_.get(this.props, "location.search"));
      if (!params.limit) {
        params.limit = this.state.limit;
      }
      this.getVerbatimData(params);
    }
  };

  getIssues = () => {
    const {
      match: {
        params: { key },
      },
    } = this.props;
  
      axios(
        `${config.dataApi}dataset/${key}/import?limit=1&state=finished`
      )
        .then((res) => {
          const issuesCount = _.get(res, "data[0].issuesCount", {})    
          const issues = Object.keys(issuesCount).map((k) => ({label: `${k} (${issuesCount[k]})`, value: k}))
          this.setState({issues})
        })
        .catch((err) => {
          
        });
    
  }

  getVerbatimData = (params) => {
    const {
      match: {
        params: { key },
      },
    } = this.props;
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}/verbatim?${qs.stringify(params)}`)
      .then((res) => {
        this.setState({
          verbatim: res.data.result,
          verbatimError: null,
          limit: res.data.limit,
          offset: res.data.offset,
          total: res.data.total,
          loading: false,
        });
      })
      .catch((err) => {
        this.setState({
          verbatimError: err,
          verbatim: [],
          loading: false,
        });
      });
  };

  onSearch = (search) => {
    const { location } = this.props;
    const params = qs.parse(_.get(location, "search"));
    let newQuery = { ...params, ...search, offset: 0 };

    history.push({
      pathname: location.path,
      search: `?${qs.stringify(removeEmptyValues(newQuery))}`,
    });
  };

  render = () => {
    const { location, lastSuccesFullImport } = this.props;
    const { total, limit, offset, verbatim, verbatimError, issues } = this.state;
    const current = Number(offset) / Number(limit) + 1;
    const params = qs.parse(_.get(location, "search"));

    const typeFacets = _.get(lastSuccesFullImport, "verbatimByTermCount")
      ? Object.keys(lastSuccesFullImport.verbatimByTermCount).map((t) => ({
          value: t,
          label: `${t} (${lastSuccesFullImport.verbatimByTermCount[t]})`,
        }))
      : [];

    return (
      <Spin spinning={this.state.loading}>
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0",
          }}
        >
          {verbatimError && (
            <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
          )}
          <Row style={{ marginBottom: "10px" }}>
            <Col span={12}>
              {" "}
              <SearchBox
                onSearch={(value) => this.onSearch({ q: value })}
                defaultValue={_.get(params, "q")}
              ></SearchBox>
            </Col>
            <Col span={12}>
              <MultiValueFilter
                defaultValue={_.get(params, "type")}
                onChange={(value) => this.onSearch({ type: value })}
                vocab={typeFacets}
                label="Row type"
              />
              <MultiValueFilter
                defaultValue={_.get(params, "issue")}
                onChange={(value) => this.onSearch({ issue: value })}
                vocab={issues}
                label="Issues"
              />
            </Col>
            <Col span={24} style={{ textAlign: "right" }}>
              {" "}
              {
                <Pagination
                  hideOnSinglePage={true}
                  style={{ display: "inline" }}
                  current={current}
                  showSizeChanger={false}
                 /*  showSizeChanger
                  pageSizeOptions={[10, 50, 100]}
                  onShowSizeChange={(current, size) => {
                    history.push({
                      pathname: location.pathname,
                      search: `?${qs.stringify({
                        ...params,
                        limit: Number(size),
                      })}`,
                    });
                  }} */
                  onChange={(page, pageSize) => {
                    history.push({
                      pathname: location.pathname,
                      search: `?${qs.stringify({
                        ...params,
                        offset: (page - 1) * Number(limit),
                      })}`,
                    });
                  }}
                  pageSize={limit}
                  total={total}
                />
              }
            </Col>
          </Row>

          {verbatim &&
            verbatim.length > 0 &&
            verbatim.map((v) => (
              <VerbatimPresentation
                key={v.id}
                datasetKey={v.datasetKey}
                verbatimKey={v.id}
                basicHeader={true}
                location={location}
              />
            ))}
        </div>
      </Spin>
    );
  };
}

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(withRouter(VerbatimRecord));
