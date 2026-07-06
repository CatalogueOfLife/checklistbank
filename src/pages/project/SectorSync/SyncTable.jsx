import { useEffect, useState, useRef } from "react";
import withRouter from "../../../withRouter";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { CodeOutlined, DiffOutlined, WarningOutlined, FileTextOutlined } from "@ant-design/icons";

import { Table, Alert, Tag, Tooltip, Row, Col } from "antd";
import config from "../../../config";
import qs from "query-string";
import moment from "dayjs";
import history from "../../../history";
import SyncButton from "./SyncButton";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import kibanaQuery from "./kibanaQuery";

import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import ErrorMsg from "../../../components/ErrorMsg";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";

const PAGE_SIZE = 25;

import _ from "lodash";

const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  failed: "red",
  "in queue": "orange",
};
const getColumns = (projectKey) => [
  {
    title: "Source",
    dataIndex: ["sector", "dataset", "alias"],
    key: "alias",
    ellipsis: true,
    width: 150,
    render: (text, record) => (
      <>
        {record?.warnings?.length > 0 && (
          <WarningOutlined style={{ color: "red", marginRight: "6px" }} />
        )}
        <NavLink
          to={{
            pathname: `/project/${projectKey}/dataset/${record.sector.dataset.key}/metadata`,
          }}
        >
          {_.get(record, "sector.dataset.alias") ||
            _.get(record, "sector.dataset.title")}
        </NavLink>
      </>
    ),
  },
  {
    title: "Subject",
    dataIndex: ["sector", "subject", "name"],
    key: "subject",
    width: 100,

    render: (text, record) => {
      return (
        <>
          {_.get(record, "sector.subject") && (
            <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
              {_.get(record, "sector.subject.rank")}:{" "}
            </span>
          )}
          <NavLink
            to={{
              pathname: `/project/${projectKey}/names`,
              search: `?q=${_.get(
                record,
                "sector.subject.name"
              )}&SECTOR_DATASET_KEY=${_.get(
                record,
                "sector.subjectDatasetKey"
              )}`,
            }}
            end
          >
            {_.get(record, "sector.subject.name")}
          </NavLink>
          {_.get(record, "sector.subject.broken") && (
            <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
          )}
        </>
      );
    },
  },
  {
    title: "Target",
    dataIndex: ["sector", "target", "name"],
    key: "target",
    width: 100,

    render: (text, record) => {
      return (
        <>
          {_.get(record, "sector.target.rank") && (
            <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
              {_.get(record, "sector.target.rank")}:{" "}
            </span>
          )}
          {_.get(record, "sector.target.id") && (
            <NavLink
              to={{
                pathname: `/project/${projectKey}/assembly`,
                search: `?assemblyTaxonKey=${_.get(
                  record,
                  "sector.target.id"
                )}`,
              }}
              end
            >
              {_.get(record, "sector.target.name")}
            </NavLink>
          )}
          {_.get(record, "sector.target.broken") && (
            <>
              {_.get(record, "sector.target.name")}
              <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
            </>
          )}
        </>
      );
    },
  },
  {
    title: "Mode",
    dataIndex: ["sector", "mode"],
    key: "mode",
    filters: [
      { text: "attach", value: "attach" },
      { text: "union", value: "union" },
      { text: "merge", value: "merge" },
      { text: "hierarchy", value: "hierarchy" },
    ],
    render: (text, record) => {
      return record?.sector?.mode;
    },
    width: 50,
  },
  {
    title: "Taxa",
    dataIndex: "taxonCount",
    key: "taxonCount",
    render: (text, record) => (record?.taxonCount || 0).toLocaleString("en-GB"),
    width: 50,
  },
  {
    title: "State",
    dataIndex: "state",
    key: "state",
    render: (text, record) => {
      return <Tag color={tagColors[record.state]}>{record.state}</Tag>;
    },
    width: 50,
  },

  {
    title: "Attempt",
    dataIndex: "attempt",
    key: "attempt",
    width: 50,
  },
  {
    title: "Started",
    dataIndex: "started",
    key: "started",
    width: 50,
    render: (date) => {
      return date ? moment(date).format("l LT") : "";
    },
  },
  {
    title: "Finished",
    dataIndex: "finished",
    key: "finished",
    width: 50,
    render: (date) => {
      return date ? moment(date).format("l LT") : "";
    },
  },
  {
    title: "Links",
    key: "links",
    render: (text, record) => (
      <>
        {record.state === "finished" ? (
        <>
          <Tooltip title="Name list">
            <a href={`${config.dataApi}dataset/${projectKey}/sector/${record.sectorKey}/sync/${record.attempt}/names`} target="_blank">
              <FileTextOutlined style={{ fontSize: "20px" }} />{" "}
            </a>
          </Tooltip>
          {record.attempt > 2 ? (
            <NavLink
              to={{
                pathname: `/project/${projectKey}/sync/${record.sectorKey}/diff`,
                search:
                  record.attempt > 0
                    ? `?attempts=${record.attempt - 1}..${record.attempt}`
                    : "",
              }}
            >
              <Tooltip title="Names diff">
                <DiffOutlined style={{ fontSize: "20px" }} />
              </Tooltip>{" "}
            </NavLink>
          ) : (
            <>
              <DiffOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
            </>
          )}
        </>

        ) : (
          <>
          <FileTextOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
          <DiffOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
          </>
        )}

        <Tooltip title="Kibana logs">
          <a href={kibanaQuery(record.sectorKey, record.attempt)} target="_blank">
            <CodeOutlined style={{ fontSize: "20px" }} />{" "}
          </a>
        </Tooltip>

      </>
    ),
    width: 50,
  }
];

const SyncTable = ({ location, match, user, sectorImportState, importState }) => {
  const [syncAllError, setSyncAllError] = useState(null);
  const [data, setData] = useState([]);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const projectKey = _.get(match, "params.projectKey");
  const locationSearch = _.get(location, "search");
  const locationDatasetKey = _.get(qs.parse(locationSearch), "datasetKey");
  const didMountRef = useRef(false);

  const getData = (queryParams) => {
    setLoading(true);
    setParams(queryParams);
    history.push({
      pathname: `/project/${projectKey}/sector/sync`,
      search: `?${qs.stringify(queryParams)}`,
    });
    axios(
      `${config.dataApi}dataset/${projectKey}/sector/sync?${qs.stringify(
        queryParams
      )}`
    )
      .then((res) => {
        const promises =
          res.data.result && _.isArray(res.data.result)
            ? res.data.result.map((sync) =>
                axios(
                  `${config.dataApi}dataset/${projectKey}/sector/${sync.sectorKey}`
                )
                  .then((sector) => {
                    sync.sector = sector.data;
                    sync._id = `${sync.sectorKey}_${sync.attempt}`;
                  })
                  .then(() =>
                    axios(
                      `${config.dataApi}dataset/${sync.sector.subjectDatasetKey}`
                    )
                  )
                  .then((res) => {
                    sync.sector.dataset = res.data;
                  })
              )
            : [];

        return Promise.all(promises).then(() => res);
      })
      .then((res) => {
        setPagination((prev) => ({ ...prev, total: res.data.total }));
        setLoading(false);
        setData(res.data.result);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    let query = qs.parse(locationSearch);
    if (_.isEmpty(query)) {
      query = { limit: 25, offset: 0 };
    }
    setPagination({
      pageSize: query.limit || PAGE_SIZE,
      current:
        Number(query.offset || 0) / Number(query.limit || PAGE_SIZE) + 1,
    });
    getData(query);
    didMountRef.current = true;
  }, []);

  useEffect(() => {
    if (!didMountRef.current) return;
    const currentParams = qs.parse(locationSearch);
    setPagination({
      pageSize: PAGE_SIZE,
      current: 1,
    });
    getData({ ...currentParams, limit: 25, offset: 0 });
  }, [projectKey, locationDatasetKey]);

  const handleTableChange = (newPagination, filters, sorter) => {
    const pager = { ...pagination, ...newPagination };
    pager.current = newPagination.current;

    setPagination(pager);

    let query = _.merge(params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters,
    });
    if (filters.state && _.get(filters, "state.length")) {
      query.state = filters.state;
    } else {
      query.state = importState;
    }
    if (filters.mode && _.get(filters, "mode.length")) {
      query.mode = filters.mode;
    } else {
      delete query.mode;
    }

    getData(query);
  };

  const updateSearch = (newParams) => {
    let updatedParams = {
      ...qs.parse(_.get(location, "search")),
      ...newParams,
      offset: 0,
    };
    Object.keys(newParams).forEach((param) => {
      if (!newParams[param]) {
        delete updatedParams[param];
      }
    });
    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(updatedParams),
    });
  };

  const onSelectDataset = (dataset) => {
    updateSearch({ datasetKey: dataset.key });
  };

  const { sectorKey, datasetKey } = params;

  const columns = Auth.canEditDataset({ key: projectKey }, user)
    ? [
        ...getColumns(projectKey),
        {
          title: "Action",
          dataIndex: "",
          key: "x",
          width: 50,
          render: (record) =>
            record.job === "SectorSync" ? (
              <SyncButton
                size="small"
                key={record.datasetKey}
                record={record}
              />
            ) : (
              ""
            ),
        },
      ]
    : getColumns(projectKey);

  columns[5].filters = sectorImportState.map((i) => ({
    text: _.startCase(i),
    value: i,
  }));

  columns[3].filteredValue = params.mode
    ? _.isArray(params.mode)
      ? params.mode
      : [params.mode]
    : null;

  return (
    <>
      {error && <Alert title={error.message} type="error" />}
      {syncAllError && (
        <Alert description={<ErrorMsg error={syncAllError} />} type="error" />
      )}
      <Row>
        {!sectorKey && Auth.canEditDataset({ key: projectKey }, user) && (
          <Col>
            {" "}
            <SyncAllSectorsButton
              projectKey={projectKey}
              onError={(err) => setSyncAllError(err)}
              onSuccess={() => setSyncAllError(null)}
            />
          </Col>
        )}
        {sectorKey && (
          <Col>
            <h1>Syncs for sector {sectorKey}</h1>{" "}
            <a onClick={() => getData({ limit: 25, offset: 0 })}>
              {" "}
              Show syncs for all sectors
            </a>
          </Col>
        )}
        <Col flex="auto"></Col>
        <Col>
          <DatasetAutocomplete
            defaultDatasetKey={datasetKey}
            contributesTo={projectKey}
            onResetSearch={() => updateSearch({ datasetKey: null })}
            onSelectDataset={onSelectDataset}
            placeHolder="Source dataset"
          />
        </Col>
      </Row>

      {!error && (
        <Table
          scroll={{ x: 1000 }}
          size="small"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
          expandable={{
            rowExpandable: (record) =>
              ["failed", "finished"].includes(record.state),
            expandedRowRender: (record) => {
              if (record.state === "failed") {
                return <Alert title={record.error} type="error" />;
              } else if (record.state === "finished") {
                return (
                  <>
                    {Object.keys(record)
                      .filter(
                        (k) =>
                          typeof record[k] === "object" &&
                          !["sector"].includes(k)
                      )
                      .map((k) => (
                        <Row style={{ marginBottom: "10px" }}>
                          <Col span={4}>{_.startCase(k)}: </Col>
                          <Col>
                            {Object.keys(record[k]).map((c) =>
                              !isNaN(_.get(record, `[${k}]${c}`)) ? (
                                <Tag
                                  key={c}
                                  color="blue"
                                  style={{ marginBottom: "10px" }}
                                >
                                  {_.startCase(c)}:{" "}
                                  {_.get(record, `[${k}]${c}`)}
                                </Tag>
                              ) : (
                                ""
                              )
                            )}
                          </Col>
                        </Row>
                      ))}
                    <Row>
                      <Col span={4}>Other: </Col>
                      <Col span={20}>
                        {Object.keys(record)
                          .filter(
                            (r) =>
                              ![
                                "datasetKey",
                                "attempt",
                                "createdBy",
                                "started",
                                "finished",
                                "datasetAttempt",
                              ].includes(r)
                          )
                          .map((c) =>
                            !isNaN(_.get(record, `${c}`)) ? (
                              <Tag
                                key={c}
                                color="blue"
                                style={{ marginBottom: "10px" }}
                              >
                                {_.startCase(c)}: {_.get(record, `${c}`)}
                              </Tag>
                            ) : (
                              ""
                            )
                          )}
                      </Col>
                    </Row>

                    {record?.warnings?.length > 0 && (
                      <Alert
                        style={{ marginTop: "10px" }}
                        title={
                          <ul>
                            {record?.warnings.map((w) => (
                              <li>{w}</li>
                            ))}
                          </ul>
                        }
                        type="error"
                      />
                    )}
                  </>
                );
              }
            },
          }}
          /*  expandedRowRender={(record) => {
           if (record.state === "failed") {
             return <Alert message={record.error} type="error" />;
           } else if (record.state === "finished") {
             return (
               <React.Fragment>
                 <Tag key="speciesCount" color="blue">
                   Species Count: {_.get(record, `taxaByRankCount.species`)}
                 </Tag>
                 {[
                   "taxonCount",
                   "synonymCount",
                   "referenceCount",
                   "distributionCount",
                   "descriptionCount",
                   "vernacularCount",
                   "mediaCount",
                 ].map((c) =>
                   !isNaN(_.get(record, `${c}`)) ? (
                     <Tag key={c} color="blue">
                       {_.startCase(c)}: {_.get(record, `${c}`)}
                     </Tag>
                   ) : (
                     ""
                   )
                 )}
               </React.Fragment>
             );
           } else return null;
         }} */
        />
      )}
    </>
  );
};

const mapContextToProps = ({ user, sectorImportState, projectKey }) => ({
  user,
  sectorImportState,
  projectKey,
});

export default withRouter(withContext(mapContextToProps)(SyncTable));
