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
                  issues: _.get(imp, "data[0].issuesCount"),
                  /*                   ,
                  usagesCount:  _.get(imp, "data[0].usagesCount"),
                  referenceCount: _.get(imp, "data[0].referenceCount") */
                }));
              })
        );
      })
      /*       .then(res => {
        return Promise.all(
          res.filter(r => !!r.issues).map(r => {
                return this.getCatalogueSpeciesCount(r.key).then(count => ({
                  ...r,
                  contributedSpecies: count
                }));
              })
        );
      }) */

      .then((res) => {
        return Promise.all(
          res
            .filter((r) => !!r.issues)
            .map((r) => {
              return this.getBrokenDecisions(r.key).then((count) => ({
                ...r,
                brokenDecisions: count,
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

  getMetrics = (sourceDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    return axios(
      `${config.dataApi}dataset/${catalogueKey}/source/${sourceDatasetKey}/metrics`
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

  render() {
    const { data, loading, error } = this.state;
    const {
      issue,
      issueMap,
      match: {
        params: { catalogueKey },
      },
      catalogue,
    } = this.props;
    const groups = issue
      ? issue
          .filter(
            (e, i) => issue.findIndex((a) => a["group"] === e["group"]) === i
          )
          .map((a) => a.group)
      : [];

    const selectedGroups = localStorage.getItem(
      "col_plus_matrix_selected_issue_groups"
    )
      ? JSON.parse(
          localStorage.getItem("col_plus_matrix_selected_issue_groups")
        )
      : [...groups];
    let groupMap = {};
    if (issue) {
      issue.forEach((i) => {
        groupMap[i.name] = i.group;
      });
    }

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

      /*   
{
        title: <Tooltip title={`Species contributed to catalogue ${catalogueKey}`}>Species count</Tooltip>,
        dataIndex: "contributedSpecies",
        key: "contributedSpecies",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench` }}
              exact={true}
            >
              {record.contributedSpecies}
            </NavLink>
          );
        },
        sorter: (a, b) => {
          return Number(_.get(a, `contributedSpecies`) || 0 ) - Number(_.get(b, `contributedSpecies`) || 0 ) ;
      }
      }, */

      {
        // brokenDecisions
        title: (
          <Tooltip title={`Number of broken decisions`}>
            Broken decisions
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
      ...issue
        .filter((d) => selectedGroups.includes(groupMap[d.name]))
        .map((i) => ({
          title: (
            <Tooltip title={i.name}>
              <span style={{ color: issueMap[i.name].color }}>
                {getIssuesAbbrev(i.name)}
              </span>
            </Tooltip>
          ),
          dataIndex: ["issues", i.name],
          key: i.name,
          render: (text, record) => {
            return (
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${record.key}/workbench`,
                  search: `?issue=${i.name}`,
                }}
                exact={true}
              >
                {text}
              </NavLink>
            );
          },
          sorter: (a, b) => {
            return (
              (_.get(a, `issues.${i.name}`) || 0) -
              (_.get(b, `issues.${i.name}`) || 0)
            );
          },
        })),
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
              <Col md={12} sm={24}>
                <MultiValueFilter
                  defaultValue={
                    selectedGroups && selectedGroups.length > 0
                      ? selectedGroups
                      : groups
                  }
                  onChange={this.updateSelectedGroups}
                  vocab={groups}
                  label="Issue groups"
                />
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

export default withContext(mapContextToProps)(GSDIssuesMatrix);
