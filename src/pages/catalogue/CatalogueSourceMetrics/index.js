import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import qs from "query-string";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Tooltip, Form } from "antd";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import MultiValueFilter from "../../NameSearch/MultiValueFilter";
import ReleaseSelect from "./ReleaseSelect";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
const _ = require("lodash");

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};
const getIssuesAbbrev = (issue) =>
  issue.split(" ").map((s) => s.charAt(0).toUpperCase());

const getColorForDiff = (current, released) => {
  const pct = released > 0 ? (current / released) * 100 : 100;
  if (pct >= 100) {
    return "green";
  } else if (pct >= 75) {
    return "orange";
  } else {
    return "red";
  }
};

class GSDIssuesMatrix extends React.Component {
  constructor(props) {
    super(props);
    // const excludeColumns = JSON.parse(localStorage.getItem('colplus_datasetlist_hide_columns')) || [];

    this.state = {
      data: [],

      columns: [],

      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = (prevProps) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    if (_.get(prevProps, "match.params.catalogueKey") !== catalogueKey) {
      this.getData();
    }
  };

  getData = () => {
    this.setState({ loading: true });
    const {
      match: {
        params: { catalogueKey },
      },
      location,
    } = this.props;
    const params = qs.parse(_.get(location, "search"));
    const { releaseKey } = params;
    axios(`${config.dataApi}dataset?limit=1000&contributesTo=${catalogueKey}`)
      .then((res) => {
        return Promise.all(
          !res.data.result
            ? []
            : res.data.result.map((r) => {
                return this.getMetrics(catalogueKey, r.key).then((metrics) => ({
                  ...r,
                  nameCount: metrics.nameCount,
                  taxonCount: metrics.taxonCount,
                  synonymCount: metrics.synonymCount,
                  referenceCount: metrics.referenceCount,
                  distributionCount: metrics.distributionCount,
                  vernacularCount: metrics.vernacularCount,
                  usagesCount: metrics.usagesCount,
                }));
              })
        ).then((res) => res);
      })
      .then((res) => {
        if (releaseKey) {
          return Promise.all(
            res.map((r) => {
              return this.getMetrics(releaseKey, r.key).then((metrics) => ({
                ...r,
                selectedReleaseMetrics: {
                  nameCount: metrics.nameCount,
                  taxonCount: metrics.taxonCount,
                  synonymCount: metrics.synonymCount,
                  referenceCount: metrics.referenceCount,
                  distributionCount: metrics.distributionCount,
                  vernacularCount: metrics.vernacularCount,
                  usagesCount: metrics.usagesCount,
                },
              }));
            })
          );
        } else {
          return res;
        }
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

  getCatalogueSpeciesCount = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/nameusage/search?limit=0&rank=SPECIES&sectorDatasetKey=${sourceDatasetKey}&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };

  getMetrics = (datasetKey, sourceDatasetKey) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}/metrics`
    ).then((res) => res.data);
  };

  getBrokenDecisions = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/decision?limit=0&subjectDatasetKey=${sourceDatasetKey}&limit=0`
    ).then((res) => _.get(res, "data.total"));
  };

  updateSelectedGroups = (groups) => {
    if (groups && groups.length > 0) {
      localStorage.setItem(
        "col_plus_matrix_selected_issue_groups",
        JSON.stringify(groups)
      );
    } else if (groups && groups.length === 0) {
      localStorage.removeItem("col_plus_matrix_selected_issue_groups");
    }
    this.setState({ selectedGroups: groups });
  };

  refreshReaseMetrics = (releaseKey) => {
    const { location } = this.props;
    const params = qs.parse(_.get(location, "search"));
    history.push({
      pathname: location.path,
      search: `?${qs.stringify({ ...params, releaseKey: releaseKey })}`,
    });
    this.setState({ loading: true });
    if (releaseKey) {
      Promise.all(
        this.state.data.map((r) => {
          return this.getMetrics(releaseKey, r.key).then((metrics) => {
            r.selectedReleaseMetrics = {
              nameCount: metrics.nameCount,
              taxonCount: metrics.taxonCount,
              synonymCount: metrics.synonymCount,
              referenceCount: metrics.referenceCount,
              distributionCount: metrics.distributionCount,
              vernacularCount: metrics.vernacularCount,
              usagesCount: metrics.usagesCount,
            };
          });
        })
      ).then(() =>
        this.setState({ loading: false, data: [...this.state.data] })
      );
    } else {
      this.state.data.forEach((r) => {
        delete r.selectedReleaseMetrics;
      });
      this.setState({ loading: false, data: [...this.state.data] });
    }
  };
  render() {
    const { data, loading, error } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
      catalogue,
      location,
    } = this.props;

    const columns = [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.alias ? `${record.alias} [${record.key}]` : record.key}
              </NavLink>
              {record.selectedReleaseMetrics && <div>Selected release:</div>}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return ("" + a.alias).localeCompare(b.alias);
        },
      },

      {
        // nameCount
        title: (
          <Tooltip title={`Total name count in last sync`}>Name count</Tooltip>
        ),
        dataIndex: "nameCount",
        key: "nameCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.nameCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.nameCount || 0,
                      record.selectedReleaseMetrics.nameCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.nameCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `nameCount`) || 0) -
            Number(_.get(b, `nameCount`) || 0)
          );
        },
      },
      {
        // usagesCount
        title: (
          <Tooltip title={`Total usages in last sync`}>Usages count</Tooltip>
        ),
        dataIndex: "usagesCount",
        key: "usagesCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.usagesCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.usagesCount || 0,
                      record.selectedReleaseMetrics.usagesCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.usagesCount || 0}
                </div>
              )}
            </React.Fragment>
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
        // synonymCount
        title: (
          <Tooltip title={`Total synonym count in last sync`}>
            Synonym count
          </Tooltip>
        ),
        dataIndex: "synonymCount",
        key: "synonymCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.synonymCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.synonymCount || 0,
                      record.selectedReleaseMetrics.synonymCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.synonymCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `synonymCount`) || 0) -
            Number(_.get(b, `synonymCount`) || 0)
          );
        },
      },
      {
        // taxonCount
        title: (
          <Tooltip title={`Total taxon count in last sync`}>
            Taxon count
          </Tooltip>
        ),
        dataIndex: "taxonCount",
        key: "taxonCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.taxonCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.taxonCount || 0,
                      record.selectedReleaseMetrics.taxonCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.taxonCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `taxonCount`) || 0) -
            Number(_.get(b, `taxonCount`) || 0)
          );
        },
      },
      {
        // vernacularCount
        title: (
          <Tooltip title={`Total vernacular count in last sync`}>
            Vernacular count
          </Tooltip>
        ),
        dataIndex: "vernacularCount",
        key: "vernacularCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.vernacularCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.vernacularCount || 0,
                      record.selectedReleaseMetrics.vernacularCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.vernacularCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `vernacularCount`) || 0) -
            Number(_.get(b, `vernacularCount`) || 0)
          );
        },
      },
      {
        // distributionCount
        title: (
          <Tooltip title={`Total distribution count in last sync`}>
            Distribution count
          </Tooltip>
        ),
        dataIndex: "distributionCount",
        key: "distributionCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.distributionCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.distributionCount || 0,
                      record.selectedReleaseMetrics.distributionCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.distributionCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `distributionCount`) || 0) -
            Number(_.get(b, `distributionCount`) || 0)
          );
        },
      },

      {
        // referenceCount
        title: (
          <Tooltip title={`Total references in last import`}>
            Refererences count
          </Tooltip>
        ),
        dataIndex: "referenceCount",
        key: "referenceCount",
        render: (text, record) => {
          return (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                }}
                exact={true}
              >
                {record.referenceCount}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div
                  style={{
                    color: getColorForDiff(
                      record.referenceCount || 0,
                      record.selectedReleaseMetrics.referenceCount || 0
                    ),
                  }}
                >
                  {record.selectedReleaseMetrics.referenceCount || 0}
                </div>
              )}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return (
            Number(_.get(a, `referenceCount`) || 0) -
            Number(_.get(b, `referenceCount`) || 0)
          );
        },
      },
    ];

    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["catalogueSourceMetrics"]}
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
              <Col md={12} sm={24}></Col>
              <Col md={12} sm={24}>
                <Form.Item
                  {...formItemLayout}
                  label="Compare with release"
                  style={{ marginBottom: "8px" }}
                >
                  <ReleaseSelect
                    catalogueKey={catalogueKey}
                    defaultReleaseKey={
                      _.get(
                        qs.parse(_.get(location, "search")),
                        "releaseKey"
                      ) || null
                    }
                    onReleaseChange={this.refreshReaseMetrics}
                  />
                </Form.Item>
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <Table
              size="small"
              columns={columns}
              dataSource={data}
              loading={loading}
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

export default withContext(mapContextToProps)(GSDIssuesMatrix);
