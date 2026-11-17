import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import qs from "query-string";
import { NavLink } from "react-router-dom";
import {
  Alert,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import config from "../../config";
import { formatTime } from "../../dateTime";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const datasetLink = (key, label = key) => (
  <NavLink to={{ pathname: `/dataset/${key}/about` }}>{label}</NavLink>
);

/**
 * The datasets of one duplicate group, loaded when the group is expanded, so
 * they can be told apart and the right one kept.
 */
const DuplicateGroup = ({ keys }) => {
  const [datasets, setDatasets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      keys.map((key) =>
        axios(`${config.dataApi}dataset/${key}`)
          .then((res) => res.data)
          .catch((err) => ({ key, error: err }))
      )
    ).then((res) => {
      if (cancelled) return;
      setDatasets(res.sort((a, b) => a.key - b.key));
      setError(res.find((d) => d.error)?.error || null);
    });
    return () => {
      cancelled = true;
    };
  }, [keys]);

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      width: 90,
      render: (key) => datasetLink(key),
    },
    { title: "Alias", dataIndex: "alias" },
    {
      title: "Origin",
      dataIndex: "origin",
      render: (origin, d) => (
        <Space size={4}>
          {origin}
          {d.private && <Tag>private</Tag>}
        </Space>
      ),
    },
    { title: "Type", dataIndex: "type" },
    { title: "Version", dataIndex: "version" },
    { title: "Issued", dataIndex: "issued" },
    {
      title: "Size",
      dataIndex: "size",
      align: "right",
      render: (v) => v?.toLocaleString(),
    },
    {
      title: "Imported",
      dataIndex: "imported",
      render: (v, d) =>
        v && d.attempt ? (
          <NavLink to={{ pathname: `/dataset/${d.key}/imports/${d.attempt}` }}>
            {formatTime(v, "ll")}
          </NavLink>
        ) : (
          formatTime(v, "ll")
        ),
    },
    {
      title: "GBIF",
      dataIndex: "gbifKey",
      render: (v) =>
        v && (
          <a href={`https://www.gbif.org/dataset/${v}`}>
            {v.substring(0, 8)}…
          </a>
        ),
    },
    {
      title: "Created",
      dataIndex: "created",
      render: (v) => formatTime(v, "ll"),
    },
  ];

  return (
    <>
      {error && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          title={`Some datasets could not be loaded: ${error.message}`}
        />
      )}
      <Table
        size="small"
        rowKey="key"
        loading={!datasets}
        columns={columns}
        dataSource={(datasets || []).filter((d) => !d.error)}
        pagination={false}
      />
    </>
  );
};

/**
 * Datasets sharing the same title and description, from /dataset/duplicates.
 * Deleted and temporary datasets are left out by the API.
 */
const DuplicateDatasets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minCount, setMinCount] = useState(2);
  const [publisher, setPublisher] = useState("");
  const [q, setQ] = useState("");

  const publisherValid = !publisher || UUID.test(publisher.trim());

  useEffect(() => {
    if (!publisherValid) return;
    setLoading(true);
    axios(
      `${config.dataApi}dataset/duplicates?${qs.stringify({
        minCount: minCount || 2,
        gbifPublisherKey: publisher.trim() || undefined,
      })}`
    )
      .then((res) => {
        setData(res.data || []);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [minCount, publisher, publisherValid]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term
      ? data.filter((d) => d.name?.toLowerCase().includes(term))
      : data;
  }, [data, q]);

  const datasetCount = filtered.reduce((n, d) => n + d.keys.length, 0);

  const columns = [
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Datasets",
      key: "count",
      width: 100,
      align: "right",
      sorter: (a, b) => a.keys.length - b.keys.length,
      render: (_, d) => d.keys.length,
    },
    {
      title: "Keys",
      dataIndex: "keys",
      key: "keys",
      width: 280,
      render: (keys) => (
        <Space size={[8, 0]} wrap>
          {[...keys].sort((a, b) => a - b).map((k) => (
            <span key={k}>{datasetLink(k)}</span>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <>
      <p>
        Datasets that share the same title and description. Expand a row to
        compare the datasets of a group and decide which ones to keep.
      </p>
      <Row gutter={16} style={{ marginBottom: 10 }} align="top">
        <Col>
          <Form.Item label="Minimum datasets" style={{ marginBottom: 0 }}>
            <InputNumber
              min={2}
              precision={0}
              value={minCount}
              onChange={setMinCount}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item
            label="GBIF publisher"
            style={{ marginBottom: 0 }}
            validateStatus={publisherValid ? undefined : "error"}
            help={publisherValid ? undefined : "Not a GBIF publisher key"}
          >
            <Input
              allowClear
              placeholder="organisation key (UUID)"
              style={{ width: 320 }}
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item label="Title" style={{ marginBottom: 0 }}>
            <Input
              allowClear
              placeholder="filter titles"
              style={{ width: 240 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>
      {error && <Alert title={error.message} type="error" />}
      {!error && (
        <>
          <Typography.Text type="secondary">
            {loading
              ? "Loading…"
              : `${filtered.length.toLocaleString()} titles with ${datasetCount.toLocaleString()} datasets`}
          </Typography.Text>
          <Table
            size="middle"
            rowKey={(d) => d.keys.join("-")}
            columns={columns}
            dataSource={filtered}
            loading={loading}
            expandable={{
              expandedRowRender: (d) => <DuplicateGroup keys={d.keys} />,
            }}
            pagination={{ pageSize: 50, showSizeChanger: false }}
          />
        </>
      )}
    </>
  );
};

export default DuplicateDatasets;
