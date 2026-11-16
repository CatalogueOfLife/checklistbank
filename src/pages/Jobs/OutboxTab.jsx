import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Tag,
  Select,
  Space,
  Button,
  Popconfirm,
  Tooltip,
  Alert,
  App,
} from "antd";
import { ReloadOutlined, RedoOutlined, DeleteOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import ErrorMsg from "../../components/ErrorMsg";
import PresentationItem from "../../components/PresentationItem";
import config from "../../config";
import { formatTime } from "../../dateTime";
import {
  getOutbox,
  retryOutbox,
  deleteOutbox,
  getOutboxVocab,
} from "../../api/outbox";
import { decorateJobs } from "./decorate";

const pollingHeartBeat = config.pollingHeartBeat || 5000;
const PAGE_SIZE = 25;

const STATUS_COLOR = { pending: "orange", running: "blue", failed: "red" };

// "sector delete" on the wire, but be lenient about SECTOR_DELETE
const norm = (v) => (v ? String(v).toLowerCase().replace(/_/g, " ") : v);

const dt = (v) => formatTime(v, "lll");

/**
 * The key of a command says what it is about, in a form that depends on its
 * type. Link it to that thing where there is one.
 */
const OutboxKey = ({ type, value }) => {
  if (!value) return null;
  switch (norm(type)) {
    case "doi":
      return (
        <a href={`https://doi.org/${value}`} target="_blank" rel="noreferrer">
          {value}
        </a>
      );
    case "release published":
    case "gbif registry":
      return <NavLink to={`/dataset/${value}/metadata`}>{value}</NavLink>;
    case "sector delete": {
      // projectKey:sectorId - the sector is on its way out, so link the project
      const [project, sector] = String(value).split(":");
      return (
        <span>
          <NavLink to={`/project/${project}/metadata`}>{project}</NavLink>:
          {sector}
        </span>
      );
    }
    default:
      return value;
  }
};

const OutboxDetail = ({ entry }) => (
  <>
    {entry.lastError && (
      <PresentationItem label="Last error">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {entry.lastError}
        </pre>
      </PresentationItem>
    )}
    <PresentationItem label="Params">
      <pre style={{ background: "#f5f5f5", padding: 8, overflow: "auto" }}>
        {JSON.stringify(entry.params, null, 2)}
      </pre>
    </PresentationItem>
    <PresentationItem label="Version">{entry.version}</PresentationItem>
    <PresentationItem label="Claimed by">{entry.claimedBy}</PresentationItem>
    <PresentationItem label="Modified">{dt(entry.modified)}</PresentationItem>
  </>
);

/**
 * The backend outbox: durable commands that must run exactly once, like
 * DataCite calls, sector deletions, the work after a release is published and
 * GBIF registry updates. Succeeded commands are deleted, so this only ever
 * shows what is still waiting, running or has failed. Admin only.
 */
const OutboxTab = () => {
  const { message } = App.useApp();
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filter, setFilter] = useState({});
  const [page, setPage] = useState({ limit: PAGE_SIZE, offset: 0 });
  const [data, setData] = useState({ result: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const timer = useRef(null);
  const latest = useRef(0);

  useEffect(() => {
    getOutboxVocab("outboxtype").then(setTypes);
    getOutboxVocab("outboxstatus").then(setStatuses);
  }, []);

  const load = async () => {
    // a slower earlier request must not overwrite the result of a later one
    const req = ++latest.current;
    try {
      const res = await getOutbox({ ...filter, ...page });
      const result = await decorateJobs(
        (res?.result || []).map((e) => ({ ...e, userKey: e.createdBy }))
      );
      if (req !== latest.current) return;
      setData({ total: res?.total ?? result.length, result });
      setError(null);
    } catch (err) {
      // keep the last good page on a transient error rather than blanking it
      if (req === latest.current) setError(err);
    } finally {
      if (req === latest.current) setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    timer.current = setInterval(load, pollingHeartBeat);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [JSON.stringify(filter), page.limit, page.offset]);

  const act = async (id, fn, done) => {
    setBusy(id);
    try {
      const { data: ok } = await fn(id);
      if (ok === false) message.warning(`Outbox command ${id} is gone`);
      else message.success(done);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
      load();
    }
  };

  const setFilterValue = (key, value) => {
    setFilter({ ...filter, [key]: value || undefined });
    setPage({ ...page, offset: 0 });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 150,
    },
    {
      title: "Key",
      key: "key",
      width: 200,
      render: (text, record) => (
        <OutboxKey type={record.type} value={record.key} />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s) => (
        <Tag color={STATUS_COLOR[norm(s)] || "default"}>{s}</Tag>
      ),
    },
    {
      title: "Due",
      dataIndex: "due",
      key: "due",
      width: 165,
      render: dt,
    },
    {
      title: "Attempts",
      dataIndex: "attempts",
      key: "attempts",
      width: 80,
      align: "right",
    },
    {
      title: "Last error",
      dataIndex: "lastError",
      key: "lastError",
      width: 300,
      ellipsis: true,
      onCell: (record) => ({
        style: { maxWidth: 300 },
        title: record.lastError ?? undefined,
      }),
    },
    {
      title: "User",
      key: "createdBy",
      width: 104,
      ellipsis: true,
      render: (text, record) => record.user?.username || record.createdBy,
    },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      width: 165,
      render: dt,
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (text, record) => {
        const running = norm(record.status) === "running";
        return (
          <Space size={4}>
            <Tooltip title="Run now, with attempts reset">
              <Button
                size="small"
                icon={<RedoOutlined />}
                disabled={running}
                loading={busy === record.id}
                onClick={() =>
                  act(record.id, retryOutbox, `Retrying command ${record.id}`)
                }
              />
            </Tooltip>
            <Popconfirm
              title={`Remove outbox command ${record.id} for good?`}
              okText="Delete"
              okButtonProps={{ danger: true }}
              disabled={running}
              onConfirm={() =>
                act(record.id, deleteOutbox, `Deleted command ${record.id}`)
              }
            >
              <Tooltip title="Delete">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={running}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: 8 }}
          type="warning"
          closable
          onClose={() => setError(null)}
          description={<ErrorMsg error={error} />}
        />
      )}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Any type"
          style={{ width: 200 }}
          value={filter.type}
          onChange={(v) => setFilterValue("type", v)}
          options={types.map((t) => ({ value: t, label: t }))}
        />
        <Select
          allowClear
          placeholder="Any status"
          style={{ width: 160 }}
          value={filter.status}
          onChange={(v) => setFilterValue("status", v)}
          options={statuses.map((s) => ({ value: s, label: s }))}
        />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Refresh
        </Button>
      </Space>
      <Table
        size="small"
        rowKey="id"
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={data.result}
        loading={loading}
        pagination={{
          current: Math.floor(page.offset / page.limit) + 1,
          pageSize: page.limit,
          total: data.total,
          showSizeChanger: true,
        }}
        onChange={(p) =>
          setPage({ limit: p.pageSize, offset: (p.current - 1) * p.pageSize })
        }
        expandable={{
          expandedRowRender: (record) => <OutboxDetail entry={record} />,
        }}
      />
    </>
  );
};

export default OutboxTab;
