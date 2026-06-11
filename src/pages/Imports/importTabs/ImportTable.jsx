import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { CodeOutlined, DiffOutlined, FileZipOutlined, FileTextOutlined } from "@ant-design/icons";

import { Table, Alert, Tag, Tooltip, Row, Col } from "antd";
import config from "../../../config";
import qs from "query-string";
import moment from "dayjs";
import history from "../../../history";
import ErrorMsg from "../../../components/ErrorMsg";
import ImportButton from "./ImportButton";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import ImportMetrics from "../../../components/ImportMetrics";
import kibanaQuery from "./kibanaQuery";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";

import _ from "lodash";

const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  released: "green",
  failed: "red",
  waiting: "orange",
};

const ImportTable = (props) => {
  const { section, importState, user, addError, location } = props;

  const timerRef = useRef(null);

  const defaultColumns = [
    {
      title: "Title",
      dataIndex: ["dataset", "title"],
      key: "title",
      render: (text, record) => (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/names` }}
          end
        >
          {_.get(record, "dataset.alias") ||
            _.get(record, "dataset.title") ||
            `Dataset ${record.datasetKey}`}
        </NavLink>
      ),
      width: 150,
      ellipsis: true
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (text, record) => (
        <Tag color={tagColors[record.state]}>{record.state}</Tag>
      ),
      width: 40,
    },
    {
      title: "Job",
      dataIndex: "job",
      key: "job",
      render: (text, record) => (
        <React.Fragment>
          <span>{_.get(record, "job")}</span>&nbsp;
          {"upload" in record &&
            (_.get(record, "upload") ? (
              <UploadOutlined />
            ) : (
              <DownloadOutlined />
            ))}
        </React.Fragment>
      ),
      width: 50,
    },
    {
      title: "Attempt",
      dataIndex: "attempt",
      key: "attempt",
      width: 25,
    },
    {
      title: "Started",
      dataIndex: "started",
      key: "started",
      width: 60,
      render: (date) => {
        return date ? moment(date).format("MMMM Do, h:mm a") : "";
      },
    },
    {
      title: "Finished",
      dataIndex: "finished",
      key: "finished",
      width: 60,
      render: (date) => {
        return date ? moment(date).format("MMMM Do, h:mm a") : "";
      },
    },
    {
      title: "Links",
      key: "link",
      width: 50,
      render: (text, record) => (
        <>
        {_.get(record, "dataset.origin") === "external" ? (
          <>
          <Tooltip title="Data Archive">
            <a href={`${config.dataApi}dataset/${record.datasetKey}/archive.zip?attempt=${record.attempt}`} target="_blank">
              <FileZipOutlined style={{ fontSize: "20px" }} />
            </a>{" "}
          </Tooltip>

          {record.state === "finished" ? (
            <>
            <Tooltip title="TextTree">
              <a href={`${config.dataApi}dataset/${record.datasetKey}/import/${record.attempt}/tree.txt`} target="_blank">
                <FileTextOutlined style={{ fontSize: "20px" }} />
              </a>{" "}
            </Tooltip>

            <Tooltip title="Name list">
              <a href={`${config.dataApi}dataset/${record.datasetKey}/import/${record.attempt}/names.txt`} target="_blank">
                <FileTextOutlined style={{ fontSize: "20px" }} />
              </a>{" "}
            </Tooltip>
            </>
          ) : (
            <>
            <FileTextOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
            <FileTextOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
            </>
          )}
          </>
        ) : (
          <>
          <FileZipOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
          <FileTextOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
          <FileTextOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
          </>
        )}

          {record.attempt > 1 && record.state === "finished" ? (
            <NavLink
              to={{
                pathname: `/dataset/${record.datasetKey}/diff`,
                search:
                  record.attempt > 0
                    ? `?attempts=${record.attempt - 1}..${record.attempt}`
                    : "",
              }}
            >
              <Tooltip title="Names Diff">
                <DiffOutlined style={{ fontSize: "20px" }} />{" "}
              </Tooltip>
            </NavLink>
          ) : (
            <>
            <DiffOutlined style={{ fontSize: "20px", color: "#EEEEEE" }} />{" "}
            </>
          )}

          <Tooltip title="Kibana Logs">
            <a href={kibanaQuery(record.datasetKey)} target="_blank">
              <CodeOutlined style={{ fontSize: "20px" }} />
            </a>
          </Tooltip>
        </>
      )
    },
  ];

  const [data, setData] = useState([]);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: 10,
    current: 1,
  });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [columns, setColumns] = useState(defaultColumns);

  const updateStatusQuery = (query, cols) => {
    const updatedCols = cols.map((c) => {
      if (c.key === "state") {
        let filter = typeof query.state === "string" ? [query.state] : query.state;
        return { ...c, filteredValue: filter };
      }
      return c;
    });
    return updatedCols;
  };

  const getData_ = (currentParams) => {
    setLoading(true);

    axios(`${config.dataApi}importer?${qs.stringify(currentParams)}`)
      .then((res) => {
        const promises =
          res.data.result && _.isArray(res.data.result)
            ? res.data.result.map((imp) =>
              axios(`${config.dataApi}dataset/${imp.datasetKey}`).then(
                (dataset) => {
                  imp.dataset = dataset.data;
                  imp._id = `${imp.datasetKey}_${imp.attempt}`;
                }
              )
            )
            : [];

        return Promise.allSettled(promises).then(() => res);
      })
      .then((res) => {
        const total = res.data.total;

        setPagination((prev) => ({ ...prev, total }));
        setLoading(false);
        setLoaded(true);
        setLoadError(false);
        setData(
          res.data.result
            ? res.data.result.slice(0, Number(pagination.pageSize))
            : []
        );

        if (section !== "running") {
          history.push({
            pathname: `/imports`,
            search: `?${qs.stringify(currentParams)}`,
          });
        }
      })
      .catch((err) => {
        setLoading(false);
        setLoadError(true);
        // The running tab polls every 3s. Against a flapping backend, keep the last
        // good rows and let the render show a "reconnecting" hint instead of wiping
        // the table (which would falsely read as "No running imports.") or popping a
        // global error notification on every failed poll. The finished tab is a
        // one-shot user action, so surface the error there as before.
        if (section !== "running") {
          addError(err);
          setData([]);
        }
      });
  };

  useEffect(() => {
    let query = qs.parse(_.get(props, "location.search"));
    if (_.isEmpty(query) || section === "running") {
      query = {
        limit: 10,
        offset: 0,
        state: importState
      };
    }
    let updatedCols = defaultColumns;
    if (query.state) {
      updatedCols = updateStatusQuery(query, defaultColumns);
    }
    setColumns(updatedCols);
    setParams(query);
    setPagination({
      pageSize: query.limit,
      current: Number(query.offset) / Number(query.limit) + 1,
    });
    getData_(query);

    if (section === "running") {
      timerRef.current = setInterval(() => {
        getData_(query);
      }, config.pollingHeartBeat || 5000);
    }

    return () => {
      if (section === "running" && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTableChange = (newPagination, filters, sorter) => {
    const pager = { ...pagination, ...newPagination };
    setPagination(pager);

    let query = section === "finished" ? _.merge({ ...params }, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters,
    }) : {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters,
    };

    if (filters.state && _.get(filters, "state.length")) {
      query.state = filters.state;
    } else {
      query.state = importState;
    }
    const updatedCols = updateStatusQuery(query, columns);
    setColumns(updatedCols);
    setParams(query);
    getData_(query);
  };

  const renderColumns = Auth.isAuthorised(user, ["editor", "admin"])
    ? [
      ...columns,
      {
        title: "Action",
        dataIndex: "",
        key: "x",
        width: 110,
        render: (record) =>
          _.get(record, "dataset.origin") === "external" ? (
            <ImportButton
              key={record.datasetKey}
              record={record}
            ></ImportButton>
          ) : (
            ""
          ),
      },
    ]
    : columns;

  if (section === "finished") {
    renderColumns[1] = {
      ...renderColumns[1],
      filters: importState.map((i) => ({
        text: _.startCase(i),
        value: i,
      })),
    };
  }

  return (
    <>
      {(section === 'running' && data.length === 0 && loaded && !loadError) && <Row><Col flex="auto"></Col><Col><h1>No running imports.</h1></Col><Col flex="auto"></Col></Row>}
      {(section === 'running' && data.length === 0 && loadError) && <Row><Col flex="auto"></Col><Col><h1>Could not reach the server — retrying…</h1></Col><Col flex="auto"></Col></Row>}
      {(section === 'running' && data.length > 0) && <h1>Running imports{loadError ? ' (reconnecting…)' : ''}:</h1>}
      {(section === 'finished') && <h1>Completed imports:</h1>}

      {!(section === 'running' && data.length === 0) && (
        <Table
          scroll={{ x: "max-content" }}
          size="small"
          columns={renderColumns}
          dataSource={data}
          pagination={pagination}
          onShowSizeChange={(current, size) => {
            console.log(`${current} ${size}`)
          }}
          onChange={handleTableChange}
          rowKey="_id"
          expandable={{
            expandedRowRender: (record) => {
              if (record.state === "failed") {
                return <Alert title={record.error} type="error" />;
              } else {
                return <ImportMetrics data={record}></ImportMetrics>;
              }
            },
            rowExpandable: (record) => section === "finished" && !['unchanged', 'canceled'].includes(record.state)
          }}
        />
      )}
    </>
  );
};

const mapContextToProps = ({ user, projectKey, addError }) => ({ user, projectKey, addError });

export default withContext(mapContextToProps)(ImportTable);
