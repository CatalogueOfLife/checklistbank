import React from "react";
import axios from "axios";
import qs from "query-string";
import { NavLink, withRouter } from "react-router-dom";
import { Table, Alert, Row, Col, Form, Select, Switch } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import config from "../../../config";
import ReleaseSelect from "./ReleaseSelect";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import TaxonomicCoverage from "./TaxonomicCoverage";
import Links from "./Links";
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

const defaultViewColumnOrder =
  "sectorCount usagesCount taxonCount synonymCount bareNameCount appliedDecisionCount estimateCount nameCount referenceCount vernacularCount distributionCount mediaCount typeMaterialCount treatmentCount nameRelationsCount taxonConceptRelationsCount speciesInteractionsCount".split(
    " "
  );

const getIconForDiff = (current, released) => {
  const pct = released > 0 ? (current / released) * 100 : -1;
  if (pct === -1 || pct === 100) {
    return "";
  } else if (pct > 100) {
    return <ArrowUpOutlined style={{ color: "green" }} />;
  } else if (pct < 100) {
    return <ArrowDownOutlined style={{ color: "red" }} />;
  }
};

class SourceMetrics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      filteredData: [],
      groups: {},
      selectedGroup: "default",
      loading: false,
      releaseKey: null,
      hideUnchanged: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = (prevProps) => {
    const { catalogueKey, datasetKey } = this.props;

    if (
      prevProps.catalogueKey !== catalogueKey ||
      prevProps.datasetKey !== datasetKey
    ) {
      this.getData();
    }
  };

  getData = () => {
    const { datasetKey, location } = this.props;
    const params = qs.parse(_.get(location, "search"));
    const { releaseKey, hideUnchanged } = params;
    this.setState({ loading: true, releaseKey });

    axios(
      `${config.dataApi}dataset?limit=1000&contributesTo=${datasetKey}&sortBy=alias`
    )
      .then((res) => {
        let columns = {};
        return Promise.all(
          !res.data.result
            ? []
            : res.data.result.map((r) => {
                return this.getMetrics(datasetKey, r.key).then((metrics) => {
                  columns = _.merge(columns, metrics);
                  return {
                    ...r,
                    metrics: metrics,
                  };
                });
              })
        ).then((res) => {
          const groups = {
            default: Object.keys(columns).filter(
              (c) =>
                typeof columns[c] !== "object" &&
                !["attempt", "datasetKey"].includes(c)
            ),
            ...Object.keys(columns)
              .filter((c) => typeof columns[c] === "object")
              .reduce((obj, key) => {
                obj[key] = Object.keys(columns[key]);
                return obj;
              }, {}),
          };
          this.setState({
            groups,
            selectedGroup: "default",
          });
          return { res, groups };
        });
      })
      .then(({ res, groups }) => {
        if (releaseKey) {
          return Promise.all(
            res.map((r) => {
              return this.getMetrics(releaseKey, r.key).then((metrics) => ({
                ...r,
                selectedReleaseMetrics: metrics,
              }));
            })
          ).then((result) => ({ res: result, groups }));
        } else {
          return { res, groups };
        }
      })
      .then(({ res, groups }) => {
        const columns = groups.default.map((column) => ({
          dataIndex: ["metrics", column],
        }));
        const filteredData = hideUnchanged
          ? this.getChangedDataOnly(res, columns)
          : [];
        this.setState({
          loading: false,
          data: res,
          filteredData,
          hideUnchanged,
          err: null,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getMetrics = (datasetKey, sourceDatasetKey) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}/metrics`
    ).then((res) => res.data);
  };

  refreshReleaseMetrics = (releaseKey) => {
    const { location } = this.props;
    const params = qs.parse(_.get(location, "search"));
    history.push({
      pathname: location.path,
      search: `?${qs.stringify({ ...params, releaseKey: releaseKey })}`,
    });
    this.setState({ loading: true, releaseKey });
    if (releaseKey) {
      Promise.all(
        this.state.data.map((r) => {
          return this.getMetrics(releaseKey, r.key).then((metrics) => {
            r.selectedReleaseMetrics = metrics;
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

  selectGroup = (value, additionalColumns) => {
    const { hideUnchanged, data } = this.state;
    if (hideUnchanged) {
      const filteredData = this.getChangedDataOnly(data, additionalColumns);
      this.setState({
        selectedGroup: value,
        filteredData,
        loading: false,
      });
    } else {
      this.setState({ selectedGroup: value, filteredData: [] });
    }
  };

  getChangedDataOnly = (data, additionalColumns) => {
    const columns = additionalColumns.map((c) =>
      c.dataIndex.slice(1).join(".")
    );
    return data.filter((record) => {
      return columns.find(
        (column) =>
          _.get(record, `metrics.${column}`) !==
          _.get(record, `selectedReleaseMetrics.${column}`)
      );
    });
  };

  render() {
    const {
      data,
      loading,
      error,
      groups,
      selectedGroup,
      hideUnchanged,
      releaseKey,
      filteredData,
    } = this.state;
    const { catalogueKey, datasetKey, location, rank, basePath, isProject } =
      this.props;

    const columnsSorter =
      selectedGroup && selectedGroup.indexOf("Rank") > -1
        ? (a, b) => rank.indexOf(b) - rank.indexOf(a)
        : selectedGroup === "default"
        ? (a, b) =>
            defaultViewColumnOrder.indexOf(a) -
            defaultViewColumnOrder.indexOf(b)
        : (a, b) => a.localeCompare(b);

    const additionalColumns = !groups[selectedGroup]
      ? []
      : groups[selectedGroup].sort(columnsSorter).map((column) => ({
          // nameCount
          title: _.startCase(column).split(" Count")[0],
          dataIndex:
            selectedGroup === "default"
              ? ["metrics", column]
              : ["metrics", selectedGroup, column],
          key: column,
          render: (text, record) => {
            const selectedRelaseValue =
              selectedGroup === "default"
                ? _.get(record, `selectedReleaseMetrics[${column}]`)
                : _.get(
                    record,
                    `selectedReleaseMetrics[${selectedGroup}][${column}]`
                  );

            const linkKey =
              selectedGroup === "default" ? column : selectedGroup;
            return (
              <React.Fragment>
                {typeof Links[linkKey] === "function" && (
                  <NavLink
                    to={{
                      pathname: Links[linkKey](column, record.key, basePath)
                        .pathname,
                      search: Links[linkKey](column, record.key, basePath)
                        .search,
                    }}
                    exact={true}
                  >
                    {Number(text || 0).toLocaleString()}{" "}
                    {getIconForDiff(text || 0, selectedRelaseValue || 0)}
                  </NavLink>
                )}
                {typeof Links[linkKey] !== "function" && (
                  <React.Fragment>
                    {Number(text || 0).toLocaleString()}{" "}
                    {getIconForDiff(text || 0, selectedRelaseValue || 0)}
                  </React.Fragment>
                )}

                {record.selectedReleaseMetrics && (
                  <div>{Number(selectedRelaseValue || 0).toLocaleString()}</div>
                )}
              </React.Fragment>
            );
          },
          sorter: (a, b) => {
            const path =
              selectedGroup === "default"
                ? `metrics[${column}]`
                : `metrics[${selectedGroup}][${column}]`;
            return Number(_.get(a, path) || 0) - Number(_.get(b, path) || 0);
          },
        }));

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
                  pathname: isProject
                    ? `/catalogue/${datasetKey}/dataset/${record.key}/metadata`
                    : `/dataset/${datasetKey}/source/${record.key}`,
                  //  search: `?SECTOR_DATASET_KEY=${record.key}`,
                }}
                exact={true}
              >
                {record.alias
                  ? `${record.alias}${isProject ? " [" + record.key + "]" : ""}`
                  : record.key}
              </NavLink>
              {record.selectedReleaseMetrics && <div>Selected release:</div>}
            </React.Fragment>
          );
        },
        sorter: (a, b) => {
          return ("" + a.alias).localeCompare(b.alias);
        },
      },

      ...additionalColumns,
    ];
    const scroll =
      columns.length < 8
        ? null
        : { x: `${800 + (columns.length - 7) * 200}px` };

    return (
      <React.Fragment>
        <div>
          <Row>
            <Col md={12} sm={24}>
              <Form.Item
                {...formItemLayout}
                label="Select view"
                style={{ marginBottom: "8px" }}
              >
                <Select
                  style={{ width: "300px" }}
                  value={selectedGroup}
                  onChange={(value) =>
                    this.selectGroup(value, additionalColumns)
                  }
                >
                  {Object.keys(groups).map((k) => (
                    <Select.Option key={k} value={k}>
                      {_.startCase(k)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col md={12} sm={24}>
              <Form.Item
                {...formItemLayout}
                label="Compare with release"
                style={{ marginBottom: "8px" }}
              >
                <ReleaseSelect
                  omitList={this.props.omitList}
                  catalogueKey={catalogueKey}
                  defaultReleaseKey={
                    _.get(qs.parse(_.get(location, "search")), "releaseKey") ||
                    null
                  }
                  onReleaseChange={this.refreshReleaseMetrics}
                />
              </Form.Item>
            </Col>
          </Row>
          {releaseKey && (
            <Row>
              <Col flex="auto"></Col>
              <Col>
                <Form.Item
                  label="Show changed only"
                  style={{ marginBottom: "8px" }}
                >
                  <Switch
                    checked={hideUnchanged}
                    onChange={(hideUnchanged) => {
                      this.setState({ hideUnchanged });
                      const params = qs.parse(_.get(location, "search"));
                      if (hideUnchanged) {
                        history.push({
                          pathname: location.path,
                          search: `?${qs.stringify({
                            ...params,
                            hideUnchanged: hideUnchanged,
                          })}`,
                        });
                        const filteredData = this.getChangedDataOnly(
                          data,
                          additionalColumns
                        );
                        this.setState({ filteredData });
                      } else {
                        history.push({
                          pathname: location.path,
                          search: `?${qs.stringify({
                            ..._.omit(params, "hideUnchanged"),
                          })}`,
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          {error && <Alert message={error.message} type="error" />}
        </div>
        {!error && (
          <Table
            size="small"
            columns={columns}
            dataSource={hideUnchanged ? filteredData : data}
            loading={loading}
            scroll={scroll}
            expandable={{
              expandedRowRender: (row) => (
                <div style={{ marginLeft: "46px" }}>
                  <h4>Taxonomic coverage</h4>
                  <TaxonomicCoverage
                    isProject={this.props.isProject === false ? false : true}
                    dataset={row}
                    catalogueKey={datasetKey}
                  />
                </div>
              ),
            }}
            pagination={{
              pageSize: 1000,
              hideOnSinglePage: true,
            }}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, rank }) => ({
  user,
  rank,
});

export default withContext(mapContextToProps)(withRouter(SourceMetrics));
