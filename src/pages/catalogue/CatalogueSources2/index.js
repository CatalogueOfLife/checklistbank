import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Tooltip } from "antd";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import MultiValueFilter from "../../NameSearch/MultiValueFilter";
import moment from "moment";
import withContext from "../../../components/hoc/withContext";

const _ = require("lodash");

const getIssuesAbbrev = (issue) =>
  issue.split(" ").map((s) => s.charAt(0).toUpperCase());

class GSDIssuesMatrix2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],

      columns: [],

      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    this.setState({ loading: true });
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios(`${config.dataApi}dataset?limit=1000&contributesTo=${catalogueKey}`)
      .then((res) => {
        return Promise.all(
          !res.data.result
            ? []
            : res.data.result.map((r) => {
              return axios(
                `${config.dataApi}dataset/${r.key}/import?limit=1`
              ).then((imp) => ({
                ...r,
                attempt: _.get(imp, "data[0].attempt"),
                usagesCount: _.get(imp, "data[0].usagesCount"),
              }));
            })
        );
      })
      .then((res) => {
        return Promise.all(
          res
            .map((r) => {
              return this.getDecisions(r.key).then((count) => ({
                ...r,
                decisions: count,
              }));
            })
        );
      })
      .then((res) => {
        return Promise.all(
          res
            .map((r) => {
              return this.getBrokenDecisions(r.key).then((count) => ({
                ...r,
                brokenDecisions: count,
              }));
            })
        );
      })
      .then((res) => {
        return Promise.all(
          res
            .map((r) => {
              return this.getSectors(r.key).then((count) => ({
                ...r,
                sectors: count,
              }));
            })
        );
      })
      .then((res) => {
        return Promise.all(
          res
            .map((r) => {
              return this.getBrokenSectors(r.key).then((count) => ({
                ...r,
                brokenSectors: count,
              }));
            })
        );
      })
      .then((res) => {
        this.setState({
          loading: false,
          data: res,
          err: null,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getSectors = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/sector?subjectDatasetKey=${sourceDatasetKey}&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };
  getBrokenSectors = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/sector?subjectDatasetKey=${sourceDatasetKey}&broken=true&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };
  getDecisions = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/decision?subjectDatasetKey=${sourceDatasetKey}&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };
  getBrokenDecisions = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/decision?broken=true&subjectDatasetKey=${sourceDatasetKey}&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };


  render() {
    const { data, loading, error } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
      catalogue,
    } = this.props;

    const columns = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
              }}
              exact={true}
            >
              {record.alias ? `${record.alias} [${record.key}]` : record.key}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return ("" + a.alias).localeCompare(b.alias);
        },
      },
      {
        title: "Imported",
        dataIndex: "imported",
        key: "imported",
        sorter: (a, b) => {
          return ("" + a.imported).localeCompare(b.imported);
        },
        render: (date) => {
          return date ? moment(date).format("MMM Do YYYY") : "";
        },
      },

      {
        title: (
          <Tooltip title={`Number of name usages`}>
            Name Usages
          </Tooltip>
        ),
        dataIndex: "usagesCount",
        key: "usagesCount",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/names`,
                search: `?limit=100&offset=0`,
              }}
              exact={true}
            >
              {record.usagesCount}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `usagesCount`) || 0) -
            Number(_.get(b, `usagesCount`) || 0)
          );
        },
      },

      {
        title: (
          <Tooltip title={`Number of sectors`}>
            Sectors
          </Tooltip>
        ),
        dataIndex: "sectors",
        key: "sectors",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/sector`,
                search: `?limit=100&offset=0&subjectDatasetKey=${record.key}`,
              }}
              exact={true}
            >
              {record.sectors}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `sectors`) || 0) -
            Number(_.get(b, `sectors`) || 0)
          );
        },
      },
      {
        title: (
          <Tooltip title={`Number of broken sectors`}>
            Decisions
          </Tooltip>
        ),
        dataIndex: "brokenSectors",
        key: "brokenSectors",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/decision`,
                search: `?broken=true&limit=100&offset=0&subjectDatasetKey=${record.key}`,
              }}
              exact={true}
            >
              {record.brokenSectors}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `brokenSectors`) || 0) -
            Number(_.get(b, `brokenSectors`) || 0)
          );
        },
      },

      {
        title: (
          <Tooltip title={`Number of decisions`}>
            Decisions
          </Tooltip>
        ),
        dataIndex: "decisions",
        key: "decisions",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/decision`,
                search: `?limit=100&offset=0&subjectDatasetKey=${record.key}`,
              }}
              exact={true}
            >
              {record.decisions}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `decisions`) || 0) -
            Number(_.get(b, `decisions`) || 0)
          );
        },
      },
      {
        title: (
          <Tooltip title={`Number of broken decisions`}>
            Decisions
          </Tooltip>
        ),
        dataIndex: "brokenDecisions",
        key: "brokenDecisions",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/decision`,
                search: `?broken=true&limit=100&offset=0&subjectDatasetKey=${record.key}`,
              }}
              exact={true}
            >
              {record.brokenDecisions}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `brokenDecisions`) || 0) -
            Number(_.get(b, `brokenDecisions`) || 0)
          );
        },
      },

    ];

    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["catalogueSources"]}
        title={catalogue ? catalogue.title : ""}
      >
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0",
          }}
        >
          <div>
            <Row>
              <Col md={12} sm={24}>
                <NavLink
                  to={{
                    pathname: `/dataset`,
                    search: `?contributesTo=${catalogueKey}`,
                  }}
                  exact={true}
                >
                  View metadata of all sources
                </NavLink>
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <Table
              showSorterTooltip={false}
              size="small"
              columns={columns}
              dataSource={data.filter((d) => d.issues)}
              loading={loading}
              scroll={{ x: "2000px" }}
              pagination={{ pageSize: 100 }}
            />
          )}
        </div>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, issue, issueMap, catalogue }) => ({
  user,
  issue,
  issueMap,
  catalogue,
});

export default withContext(mapContextToProps)(GSDIssuesMatrix2);
