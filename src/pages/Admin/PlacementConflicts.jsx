import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import qs from "query-string";
import { Table, Alert, Row, Col, InputNumber, Select, Form } from "antd";
import config from "../../config";
import withContext from "../../components/hoc/withContext";

const PAGE_SIZE = 50;

// Datasets whose latest import placed a share of its accepted genera in a taxonomic group the reference
// checklists do not know them in, flagged as PLACEMENT_CONFLICT.
// See https://github.com/CatalogueOfLife/backend/issues/1608
const PlacementConflicts = ({ datasetType }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // minimum share of conflicting genera, in percent
  const [minPercent, setMinPercent] = useState(10);
  const [type, setType] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset/placementConflict?${qs.stringify({
        minRatio: (minPercent ?? 0) / 100,
        type: type || undefined,
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
      })
      .finally(() => setLoading(false));
  }, [minPercent, type, page]);

  const columns = [
    {
      title: "Key",
      dataIndex: "datasetKey",
      key: "datasetKey",
      width: 100,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/metadata` }}
          end
        >
          {text}
        </NavLink>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
    },
    {
      title: "Attempt",
      dataIndex: "attempt",
      key: "attempt",
      width: 100,
      render: (text, record) => (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/imports/${text}` }}
          end
        >
          {text}
        </NavLink>
      ),
    },
    {
      title: "Genera",
      dataIndex: "genera",
      key: "genera",
      width: 100,
      render: (text) => text?.toLocaleString(),
    },
    {
      title: "Conflicts",
      dataIndex: "conflicts",
      key: "conflicts",
      width: 100,
      render: (text, record) => (
        <NavLink
          to={{
            pathname: `/dataset/${record.datasetKey}/names`,
            search: `?${qs.stringify({ issue: "placement conflict" })}`,
          }}
          end
        >
          {text?.toLocaleString()}
        </NavLink>
      ),
    },
    {
      title: "Ratio",
      dataIndex: "ratio",
      key: "ratio",
      width: 100,
      render: (text) => `${Math.round(text * 100)}%`,
    },
  ];

  return (
    <>
      <p>
        Public external datasets whose latest import placed some of its accepted
        genera in a taxonomic group the reference checklists do not know them
        in. Such genera are flagged with the <i>placement conflict</i> issue and
        are treated with care when merged into a project. Datasets are sorted by
        the share of conflicting genera; a high share often points to a broken
        classification in the source.
      </p>
      <Row gutter={16} style={{ marginBottom: 10 }}>
        <Col>
          <Form.Item
            label="Minimum share of genera"
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              min={0}
              max={100}
              step={5}
              value={minPercent}
              suffix="%"
              onChange={(v) => {
                setMinPercent(v);
                setPage(1);
              }}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item label="Dataset type" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              placeholder="any"
              style={{ width: 160 }}
              value={type}
              options={(datasetType || []).map((t) => ({ label: t, value: t }))}
              onChange={(v) => {
                setType(v);
                setPage(1);
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      {error && <Alert title={error.message} type="error" />}
      {!error && (
        <Table
          size="middle"
          rowKey="datasetKey"
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
      )}
    </>
  );
};

const mapContextToProps = ({ datasetType }) => ({ datasetType });

export default withContext(mapContextToProps)(PlacementConflicts);
