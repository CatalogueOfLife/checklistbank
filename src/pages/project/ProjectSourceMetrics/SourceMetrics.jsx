import { useEffect, useState } from "react";
import axios from "axios";
import qs from "query-string";
import { NavLink } from "react-router-dom";
import withRouter from "../../../withRouter";
import {
  Table,
  Alert,
  Row,
  Col,
  Form,
  Select,
  Switch,
  Tooltip,
  Checkbox,
} from "antd";
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
import MergedDataBadge from "../../../components/MergedDataBadge";
import _ from "lodash";

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

const SourceMetrics = ({
  projectKey,
  datasetKey,
  location,
  rank,
  basePath,
  isProject,
  addError,
  origin,
  omitList,
}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [groups, setGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState("default");
  const [loading, setLoading] = useState(false);
  const [releaseKey, setReleaseKey] = useState(null);
  const [releaseLabel, setReleaseLabel] = useState(null);
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [showMerged, setShowMerged] = useState(true);
  const [error, setError] = useState(null);

  const getMetrics = (dsKey, source) => {
    return axios(
      `${config.dataApi}dataset/${dsKey}/source/${source.key}/metrics?merged=${source?.merged}`
    ).then((res) => res.data);
  };

  const getPublisherMetrics = (dsKey, publisherId) => {
    return axios(
      `${config.dataApi}dataset/${dsKey}/sector/publisher/${publisherId}/metrics`
    ).then((res) => res.data);
  };

  const getChangedDataOnly = (dataArr, additionalColumns) => {
    const columns = additionalColumns.map((c) =>
      c.dataIndex.slice(1).join(".")
    );
    return dataArr.filter((record) => {
      return columns.find(
        (column) =>
          _.get(record, `metrics.${column}`) !==
          _.get(record, `selectedReleaseMetrics.${column}`)
      );
    });
  };

  const getData = () => {
    const params = qs.parse(_.get(location, "search"));
    const { releaseKey: rkParam, hideUnchanged: huParam } = params;
    setLoading(true);
    setReleaseKey(rkParam);

    Promise.all([
      axios(`${config.dataApi}dataset/${datasetKey}/source?splitMerge=true`),
      axios(
        `${config.dataApi}dataset/${datasetKey}/sector/publisher?limit=1000`
      ),
    ])
      .then(([res, publisherRes]) => {
        let columns = {};
        const datasetData = res.data || [];
        const publisherData = publisherRes?.data?.result || [];
        return Promise.all([
          ...publisherData.map((r) => {
            return getPublisherMetrics(datasetKey, r.id).then(
              (metrics) => {
                return {
                  ...r,
                  metrics: metrics,
                };
              }
            );
          }),
          ...datasetData.map((r) => {
            return getMetrics(datasetKey, r).then((metrics) => {
              columns = _.merge(columns, metrics);
              return {
                ...r,
                metrics: metrics,
              };
            });
          }),
        ]).then((res) => {
          const newGroups = {
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
          setGroups(newGroups);
          setSelectedGroup("default");
          return { res, groups: newGroups };
        });
      })
      .then(({ res, groups: newGroups }) => {
        if (rkParam) {
          return Promise.allSettled([
            ...res
              .filter((r) => !!r?.id)
              .map((r) => {
                return getPublisherMetrics(rkParam, r?.id)
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
              }),
            ...res
              .filter((r) => !!r?.key)
              .map((r) => {
                return getMetrics(rkParam, r)
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
              }),
          ]).then((result) => {
            return { res: result.map((r) => r?.value), groups: newGroups };
          });
        } else {
          return { res, groups: newGroups };
        }
      })
      .then(({ res, groups: newGroups }) => {
        const cols = (newGroups.default || []).map((column) => ({
          dataIndex: ["metrics", column],
        }));
        const sortedData = res.sort((a, b) => {
          if (!!a.id && !b.id) {
            return a;
          } else if (!!b.id && !a.id) {
            return b;
          } else if (a.alias && b.alias) {
            return a.alias.localeCompare(b.alias) === 0
              ? a.merged === true
                ? 1
                : -1
              : a.alias.localeCompare(b.alias);
          } else {
            return 0;
          }
        });
        const newFilteredData = huParam
          ? getChangedDataOnly(sortedData, cols)
          : [];
        setLoading(false);
        setData(sortedData);
        setFilteredData(newFilteredData);
        setHideUnchanged(!!huParam);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    if (datasetKey) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey, datasetKey]);

  const refreshReleaseMetrics = (newReleaseKey, newReleaseLabel) => {
    const params = qs.parse(_.get(location, "search"));
    history.push({
      pathname: location.pathname,
      search: `?${qs.stringify({ ...params, releaseKey: newReleaseKey })}`,
    });
    setLoading(true);
    setReleaseLabel(newReleaseLabel);
    if (newReleaseKey) {
      if (releaseKey !== newReleaseKey) {
        setReleaseKey(newReleaseKey);
        history.push({
          pathname: location.pathname,
          search: `?${qs.stringify({ ...params, releaseKey: newReleaseKey })}`,
        });
        Promise.allSettled([
          ...data
            .filter((r) => !!r?.id)
            .map((r) => {
              return getPublisherMetrics(newReleaseKey, r?.id)
                .then((metrics) => {
                  r.selectedReleaseMetrics = metrics;
                })
                .catch((err) => {
                  addError(err);
                  r.selectedReleaseMetrics = {};
                  r.releaseError = err;
                });
            }),
          ...data
            .filter((r) => !!r?.key)
            .map((r) => {
              return getMetrics(newReleaseKey, r)
                .then((metrics) => {
                  r.selectedReleaseMetrics = metrics;
                })
                .catch((err) => {
                  addError(err);
                  r.selectedReleaseMetrics = {};
                  r.releaseError = err;
                });
            }),
        ]).then(() => {
          setLoading(false);
          setData([...data]);
        });
      } else {
        setReleaseLabel(newReleaseLabel);
      }
    } else {
      data.forEach((r) => {
        delete r.selectedReleaseMetrics;
      });
      setLoading(false);
      setData([...data]);
    }
  };

  const selectGroup = (value, additionalColumns) => {
    if (hideUnchanged) {
      const newFilteredData = getChangedDataOnly(data, additionalColumns);
      setSelectedGroup(value);
      setFilteredData(newFilteredData);
      setLoading(false);
    } else {
      setSelectedGroup(value);
      setFilteredData([]);
    }
  };

  const renderDatasetAttempt = (datasetAttempt) =>
    datasetAttempt?.length > 1
      ? `${datasetAttempt[0]} - ${datasetAttempt[datasetAttempt.length - 1]}`
      : datasetAttempt?.length === 1
      ? datasetAttempt[0]
      : "N/A";

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
            <>
              {typeof Links[linkKey] === "function" &&
                Links[linkKey](
                  column,
                  text,
                  record.key || record.id,
                  basePath,
                  isProject,
                  isPublisher,
                  record
                ) !== null && (
                  <>
                    <NavLink
                      to={{
                        pathname: Links[linkKey](
                          column,
                          text,
                          record.key || record.id,
                          basePath,
                          isProject,
                          isPublisher,
                          record
                        ).pathname,
                        search: Links[linkKey](
                          column,
                          text,
                          record.key || record.id,
                          basePath,
                          isProject,
                          isPublisher,
                          record
                        ).search,
                      }}
                      end
                    >
                      {Number(text || 0).toLocaleString()}

                      {!isPublisher &&
                        getIconForDiff(text || 0, selectedRelaseValue || 0)}
                    </NavLink>
                    {isProject &&
                      column === "datasetAttempt" &&
                      (_.get(record, "metrics.datasetAttempt.length", 0) >
                        1 ||
                        _.get(
                          record,
                          `metrics.datasetAttempt[${
                            record?.metrics?.datasetAttempt?.length - 1
                          }]`
                        ) !== record?.metrics?.latestAttempt) && (
                        <Tooltip title="Latest Attempt">
                          {" "}
                          <NavLink
                            to={{
                              pathname: `/dataset/${record?.key}/imports/${record?.metrics?.latestAttempt}`,
                            }}
                          >
                            {` (${record?.metrics?.latestAttempt})`}
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
                  <>
                    {Number(text || 0).toLocaleString()}{" "}
                    {getIconForDiff(text || 0, selectedRelaseValue || 0)}
                  </>
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
              {record.selectedReleaseMetrics &&
                !record?.releaseError &&
                !(isPublisher && column === "datasetAttempt") && (
                  <div>
                    {Number(selectedRelaseValue || 0).toLocaleString()}
                  </div>
                )}
              {record.selectedReleaseMetrics &&
                !record?.releaseError &&
                isPublisher &&
                typeof Links[linkKey] === "function" &&
                Links[linkKey](
                  column,
                  text,
                  record.key || record.id,
                  basePath,
                  isProject,
                  isPublisher,
                  record
                ) !== null && (
                  <div>
                    {Number(selectedRelaseValue || 0).toLocaleString()}
                  </div>
                )}
            </>
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
          <>
            {record?.id && (
              <>
                <MergedDataBadge style={{ marginLeft: "0px" }} />
                Publisher:{" "}
              </>
            )}
            <NavLink
              to={{
                pathname: record?.id
                  ? `/project/${datasetKey}/publisher/${record?.id}`
                  : isProject
                  ? `/project/${datasetKey}/dataset/${record?.key}/metadata`
                  : `/dataset/${datasetKey}/source/${record?.key}`,
              }}
              end
            >
              {" "}
              {!!record?.merged && (
                <MergedDataBadge style={{ marginLeft: "0px" }} />
              )}{" "}
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
                  end
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
          </>
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
    <>
      <div>
        <Row>
          {origin === "xrelease" && (
            <Col md={2} sm={24}>
              Include <MergedDataBadge />{" "}
              <Checkbox
                checked={showMerged}
                onChange={({ target: { checked } }) => setShowMerged(checked)}
              />
            </Col>
          )}
          <Col md={10} sm={24}>
            <Form.Item
              {...formItemLayout}
              label="Select view"
              style={{ marginBottom: "8px" }}
            >
              <Select
                style={{ width: "300px" }}
                value={selectedGroup}
                onChange={(value) => selectGroup(value, additionalColumns)}
                options={Object.keys(groups).map((k) => ({
                  value: k,
                  label: _.startCase(k),
                }))}
              />
            </Form.Item>
          </Col>
          <Col md={12} sm={24}>
            <Form.Item
              {...formItemLayout}
              label="Compare with release"
              style={{ marginBottom: "8px" }}
            >
              <ReleaseSelect
                omitList={omitList}
                projectKey={projectKey}
                defaultReleaseKey={
                  _.get(qs.parse(_.get(location, "search")), "releaseKey") ||
                  null
                }
                onReleaseChange={refreshReleaseMetrics}
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
                  onChange={(newHideUnchanged) => {
                    setHideUnchanged(newHideUnchanged);
                    const params = qs.parse(_.get(location, "search"));
                    if (newHideUnchanged) {
                      history.push({
                        pathname: location.pathname,
                        search: `?${qs.stringify({
                          ...params,
                          hideUnchanged: newHideUnchanged,
                        })}`,
                      });
                      const newFilteredData = getChangedDataOnly(
                        data,
                        additionalColumns
                      );
                      setFilteredData(newFilteredData);
                    } else {
                      history.push({
                        pathname: location.pathname,
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
        {error && <Alert title={error.message} type="error" />}
      </div>
      {!error && (
        <Table
          size="small"
          rowKey={(record) => `${record.key || record.id}-${record.merged}`}
          showSorterTooltip={false}
          columns={columns}
          dataSource={(hideUnchanged ? filteredData : data).filter((d) => {
            if (!showMerged && (d?.merged || !!d?.id)) {
              return false;
            }
            if (!d?.metrics?.publisherKey) {
              return true;
            } else {
              return !(
                d?.metrics?.datasetCount === 0 ||
                d?.metrics?.usagesCount === 0
              );
            }
          })}
          loading={loading}
          scroll={scroll}
          expandable={{
            expandedRowRender: (row) => (
              <div style={{ marginLeft: "46px" }}>
                <h4>Taxonomic coverage</h4>
                <TaxonomicCoverage
                  isProject={isProject === false ? false : true}
                  dataset={row}
                  projectKey={datasetKey}
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
    </>
  );
};

const mapContextToProps = ({ user, rank, addError }) => ({
  user,
  rank,
  addError,
});

export default withContext(mapContextToProps)(withRouter(SourceMetrics));
