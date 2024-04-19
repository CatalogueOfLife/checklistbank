import React from "react";
import axios from "axios";
import qs from "query-string";
import { NavLink, withRouter } from "react-router-dom";
import { Table, Alert, Row, Col, Form, Select, Switch, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
} from "@ant-design/icons";
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
  "sectorCount nameMatchesCount usagesCount taxonCount synonymCount bareNameCount appliedDecisionCount estimateCount nameCount referenceCount vernacularCount distributionCount mediaCount typeMaterialCount treatmentCount nameRelationsCount taxonConceptRelationsCount speciesInteractionsCount".split(
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
    const { datasetKey } = this.props;
    if (datasetKey) {
      this.getData();
    }
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
  getPublisherData = async () => {
    const { datasetKey, location, addError } = this.props;
    const publisherRes = await axios(
      `${config.dataApi}dataset/${datasetKey}/sector/publisher`
    );
  };
  getData = () => {
    const { datasetKey, location, addError } = this.props;
    const params = qs.parse(_.get(location, "search"));
    const { releaseKey, hideUnchanged } = params;
    this.setState({ loading: true, releaseKey });

    Promise.all([
      axios(
        /* `${config.dataApi}dataset?limit=1000&contributesTo=${datasetKey}&sortBy=alias` */
        `${config.dataApi}dataset/${datasetKey}/source`
      ),
      axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher`),
    ])
      .then(([res, publisherRes]) => {
        let columns = {};
        const datasetData = res.data || [];
        const publisherData = publisherRes?.data?.result || [];
        return Promise.all([
          ...publisherData.map((r) => {
            return this.getPublisherMetrics(datasetKey, r.id).then(
              (metrics) => {
                // columns = _.merge(columns, metrics);
                return {
                  ...r,
                  metrics: metrics,
                };
              }
            );
          }),
          ...datasetData.map((r) => {
            return this.getMetrics(datasetKey, r.key).then((metrics) => {
              columns = _.merge(columns, metrics);
              return {
                ...r,
                metrics: metrics,
              };
            });
          }),
        ]).then((res) => {
          const groups = {
            default: Object.keys(columns).filter(
              (c) =>
                ["datasetAttempt"].includes(c) ||
                (typeof columns[c] !== "object" &&
                  ![
                    "latestAttempt",
                    "latestUsagesCount",
                    "datasetKey",
                    "sourceKey",
                    "latestMd5",
                    "datasetMd5",
                    "nameMatchesMissingCount",
                    "nameMatchesCount",
                    "bareNameCount",
                  ].includes(c))
            ),
            ...Object.keys(columns)
              .filter(
                (c) =>
                  typeof columns[c] === "object" &&
                  ![
                    "taxaByScrutinizerCount",
                    "datasetAttempt",
                    "datasetMd5",
                  ].includes(c)
              )
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
          return Promise.allSettled(
            res.map((r) => {
              return this.getMetrics(releaseKey, r.key)
                .then((metrics) => ({
                  ...r,
                  selectedReleaseMetrics: metrics,
                }))
                .catch((err) => {
                  addError(err);
                  return {
                    ...r,
                    selectedReleaseMetrics: {},
                    releaseError: err,
                  };
                });
            })
          ).then((result) => {
            return { res: result.map((r) => r?.value), groups };
          });
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
  getPublisherMetrics = (datasetKey, publisherId) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/sector/publisher/${publisherId}/metrics`
    ).then((res) => res.data);
  };
  refreshReleaseMetrics = (newReleaseKey, releaseLabel) => {
    const { location, addError } = this.props;
    const { releaseKey } = this.state;
    const params = qs.parse(_.get(location, "search"));
    history.push({
      pathname: location.path,
      search: `?${qs.stringify({ ...params, releaseKey: newReleaseKey })}`,
    });
    this.setState({ loading: true, newReleaseKey, releaseLabel });
    if (newReleaseKey) {
      if (releaseKey !== newReleaseKey) {
        this.setState({ loading: true, newReleaseKey, releaseLabel });
        history.push({
          pathname: location.path,
          search: `?${qs.stringify({ ...params, releaseKey: newReleaseKey })}`,
        });
        Promise.allSettled(
          this.state.data.map((r) => {
            return this.getMetrics(newReleaseKey, r.key)
              .then((metrics) => {
                r.selectedReleaseMetrics = metrics;
              })
              .catch((err) => {
                addError(err);
                r.selectedReleaseMetrics = {};
                r.releaseError = err;
              });
          })
        ).then((results) => {
          this.setState({ loading: false, data: [...this.state.data] });
        });
      } else {
        this.setState({ releaseLabel });
      }
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
      releaseLabel,
    } = this.state;
    const {
      catalogueKey,
      datasetKey,
      location,
      rank,
      basePath,
      isProject,
      addError,
    } = this.props;

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
            const isPublisher = !!record?.id;
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
                  <>
                    <NavLink
                      to={{
                        pathname: Links[linkKey](
                          column,
                          text,
                          record.key || record.id,
                          basePath,
                          isProject,
                          isPublisher
                        ).pathname,
                        search: Links[linkKey](
                          column,
                          text,
                          record.key || record.id,
                          basePath,
                          isProject,
                          isPublisher
                        ).search,
                      }}
                      exact={true}
                    >
                      {isPublisher && column === "datasetAttempt"
                        ? ""
                        : Number(text || 0).toLocaleString()}{" "}
                      {getIconForDiff(text || 0, selectedRelaseValue || 0)}
                    </NavLink>
                    {isProject &&
                      column === "datasetAttempt" &&
                      (_.get(record, "metrics.datasetAttempt.length", 0) > 1 ||
                        _.get(record, "metrics.datasetAttempt[0]") !==
                          record?.metrics?.latestAttempt) && (
                        <Tooltip title="Latest Attempt">
                          {" "}
                          <NavLink
                            to={{
                              pathname: `/dataset/${record?.key}/imports/${record?.metrics?.latestAttempt}`,
                            }}
                          >
                            {` (${record?.metrics?.latestAttempt}${
                              record?.metrics?.datasetMd5?.length > 1 ||
                              _.get(record, "metrics.datasetMd5[0]") !==
                                record?.metrics?.latestMd5
                                ? " *"
                                : ""
                            })`}
                          </NavLink>
                        </Tooltip>
                      )}

                    {isProject &&
                      column === "usagesCount" &&
                      Number(text || 0) <
                        record?.metrics?.latestUsagesCount && (
                        <Tooltip title="Latest Usages">
                          <NavLink
                            to={{
                              pathname: `/dataset/${record?.key}/imports/${record?.metrics?.latestAttempt}`,
                            }}
                          >
                            {` (${Number(
                              record?.metrics?.latestUsagesCount || 0
                            ).toLocaleString()})`}
                          </NavLink>
                        </Tooltip>
                      )}
                  </>
                )}
                {typeof Links[linkKey] !== "function" &&
                  (column === "nameMatchesCount" && text === 0 ? (
                    "N/A"
                  ) : (
                    <React.Fragment>
                      {Number(text || 0).toLocaleString()}{" "}
                      {getIconForDiff(text || 0, selectedRelaseValue || 0)}
                    </React.Fragment>
                  ))}
                {column === "nameMatchesCount" &&
                  record?.metrics?.nameMatchesMissingCount > 0 &&
                  ` (${Number(
                    record?.metrics?.nameMatchesMissingCount
                  ).toLocaleString()})`}
                {record?.releaseError && (
                  <div>
                    <WarningOutlined
                      onClick={() => addError(record?.releaseError)}
                      style={{ color: "red" }}
                    />
                  </div>
                )}
                {record.selectedReleaseMetrics && !record?.releaseError && (
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
        fixed: "left",
        render: (text, record) => {
          return (
            <React.Fragment>
              {record?.id && "Publisher: "}
              <NavLink
                to={{
                  pathname: record?.id
                    ? `/catalogue/${datasetKey}/publisher/${record?.id}`
                    : isProject
                    ? `/catalogue/${datasetKey}/dataset/${record?.key}/metadata`
                    : `/dataset/${datasetKey}/source/${record?.key}`,
                  //  search: `?SECTOR_DATASET_KEY=${record.key}`,
                }}
                exact={true}
              >
                {`${record?.alias || record?.key}${
                  isProject && record?.version
                    ? " [" + record?.version + "]"
                    : ""
                }`}
              </NavLink>
              {record.selectedReleaseMetrics && (
                <div>
                  Release:{" "}
                  <NavLink
                    to={{
                      pathname: `/dataset/${releaseKey}/source/${record?.key}`,
                    }}
                    exact={true}
                  >
                    {releaseLabel && releaseLabel.split(" [")[0]}{" "}
                  </NavLink>{" "}
                  {record?.releaseError && (
                    <WarningOutlined
                      onClick={() => addError(record?.releaseError)}
                      style={{ color: "red" }}
                    />
                  )}
                </div>
              )}
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
        : { y: 800, x: `${800 + (columns.length - 7) * 200}px` };

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
            rowKey={(record) => record?.key || record?.id}
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
              rowExpandable: (row) => !!row?.key,
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

const mapContextToProps = ({ user, rank, addError }) => ({
  user,
  rank,
  addError,
});

export default withContext(mapContextToProps)(withRouter(SourceMetrics));
