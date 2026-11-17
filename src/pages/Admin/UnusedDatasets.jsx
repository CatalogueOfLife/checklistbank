import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import qs from "query-string";
import {
  Table,
  Alert,
  Row,
  Col,
  InputNumber,
  Select,
  Form,
  Typography,
} from "antd";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import { formatTime, parseTime } from "../../dateTime";

const PAGE_SIZE = 50;

/**
 * Private projects and external datasets nobody used for some months, from the
 * admin only /dataset/unused, longest unused first.
 */
const UnusedDatasets = ({ datasetOrigin }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(12);
  // empty means the API default: projects and external datasets
  const [origin, setOrigin] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset/unused?${qs.stringify({
        months: months || 12,
        origin,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })}`,
    )
      .then((res) => {
        setData(res.data.result || []);
        setTotal(res.data.total);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [months, origin, page]);

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      width: 90,
      render: (key) => (
        <NavLink to={{ pathname: `/dataset/${key}/about` }}>{key}</NavLink>
      ),
    },
    { title: "Alias", dataIndex: "alias" },
    {
      title: "Title",
      dataIndex: "title",
      render: (title, d) => (
        <NavLink to={{ pathname: `/dataset/${d.key}/about` }}>{title}</NavLink>
      ),
    },
    { title: "Origin", dataIndex: "origin" },
    { title: "Type", dataIndex: "type" },
    { title: "Created by", dataIndex: "createdByName" },
    {
      title: "Created",
      dataIndex: "created",
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
      render: (v) => formatTime(v, "ll"),
    },
    {
      title: "Last used",
      dataIndex: "lastUsed",
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
      render: (v) =>
        v && (
          <span title={formatTime(v)}>
            {formatTime(v, "ll")}{" "}
            <Typography.Text type="secondary">
              ({parseTime(v).fromNow()})
            </Typography.Text>
          </span>
        ),
    },
  ];

  return (
    <>
      <p>
        Private datasets nobody has used for the given number of months,
        longest unused first, which are candidates to be deleted. Used means
        the dataset was created, changed its metadata, was imported or, for a
        project, synced a sector. Edits of the data records themselves are not
        seen, so check a project before deleting it. Temporary and deleted
        datasets are never listed, and without an origin selected only
        projects and external datasets are, as releases belong to their
        project.
      </p>
      <Row gutter={16} style={{ marginBottom: 10 }}>
        <Col>
          <Form.Item label="Unused for months" style={{ marginBottom: 0 }}>
            <InputNumber
              min={1}
              precision={0}
              value={months}
              onChange={(v) => {
                setMonths(v);
                setPage(1);
              }}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item label="Origin" style={{ marginBottom: 0 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="project, external"
              style={{ minWidth: 240 }}
              value={origin}
              onChange={(v) => {
                setOrigin(v);
                setPage(1);
              }}
              options={(datasetOrigin || []).map((o) => ({
                value: o,
                label: o,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>
      {error && <Alert title={error.message} type="error" />}
      {!error && (
        <>
          <Typography.Text type="secondary">
            {loading ? "Loading…" : `${total.toLocaleString()} datasets`}
          </Typography.Text>
          <Table
            size="middle"
            rowKey="key"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: setPage,
            }}
          />
        </>
      )}
    </>
  );
};

const mapContextToProps = ({ datasetOrigin }) => ({ datasetOrigin });

export default withContext(mapContextToProps)(UnusedDatasets);
