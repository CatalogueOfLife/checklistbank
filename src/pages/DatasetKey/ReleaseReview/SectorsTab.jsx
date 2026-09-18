import { useState, useEffect } from "react";
import { Alert, Col, InputNumber, Row, Segmented, Table, Tag } from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import _ from "lodash";
import config from "../../../config";
import Auth from "../../../components/Auth";
import withContext from "../../../components/hoc/withContext";
import { getDatasetsBatch } from "../../../api/dataset";

// What the backend flags a sector with, in the order a reviewer cares about.
// Enums are serialized lowercase by the API.
const FLAGS = ["zero", "decreased", "increased", "removed", "new"];

const FLAG_COLOR = {
  zero: "red",
  decreased: "orange",
  increased: "blue",
  removed: "red",
  new: "green",
};

const formatChange = (change) =>
  change === null || change === undefined
    ? ""
    : `${change > 0 ? "+" : ""}${(change * 100).toFixed(1)} %`;

const SectorsTab = ({ datasetKey, previousReleaseKey, dataset, user }) => {
  const [data, setData] = useState(null);
  const [sourceTitles, setSourceTitles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minChange, setMinChange] = useState(10);
  const [flag, setFlag] = useState("all");

  const mayQuery = Auth.canEditProjectOf(dataset, user);

  useEffect(() => {
    if (!mayQuery) return;
    let cancelled = false;
    setLoading(true);
    axios(
      `${config.dataApi}dataset/${datasetKey}/sector/sync/compare?to=${previousReleaseKey}&minChange=${
        minChange / 100
      }`
    )
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        setData(rows);
        setError(null);
        // One batched lookup for the source dataset titles of every flagged row
        const keys = _.uniq(
          rows.map((r) => r.subjectDatasetKey).filter((k) => !!k)
        );
        return getDatasetsBatch(keys).then((datasets) => {
          if (cancelled) return;
          setSourceTitles(
            Object.fromEntries(
              keys.map((k, i) => [k, _.get(datasets, `[${i}].alias`) || _.get(datasets, `[${i}].title`)])
            )
          );
        });
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [datasetKey, previousReleaseKey, minChange, mayQuery]);

  if (!mayQuery) {
    return (
      <Alert
        title="Sector metrics require editor rights on the project this release came from."
        type="info"
      />
    );
  }

  const columns = [
    {
      title: "Sector",
      dataIndex: "sectorKey",
      key: "sectorKey",
      render: (key) => (
        <NavLink
          to={{
            pathname: `/dataset/${datasetKey}/sector`,
            search: `?sectorKey=${key}`,
          }}
        >
          {key}
        </NavLink>
      ),
    },
    {
      title: "Flag",
      dataIndex: "flag",
      key: "flag",
      render: (f) => <Tag color={FLAG_COLOR[f]}>{f}</Tag>,
      sorter: (a, b) => FLAGS.indexOf(a.flag) - FLAGS.indexOf(b.flag),
    },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
    },
    {
      title: "Source",
      dataIndex: "subjectDatasetKey",
      key: "subjectDatasetKey",
      render: (key) =>
        key ? (
          <NavLink to={{ pathname: `/dataset/${key}` }}>
            {sourceTitles[key] || key}
          </NavLink>
        ) : null,
    },
    {
      title: "Subject",
      dataIndex: "subjectName",
      key: "subjectName",
    },
    {
      title: "Target",
      dataIndex: "targetName",
      key: "targetName",
    },
    {
      title: "Previous usages",
      dataIndex: "prevUsagesCount",
      key: "prevUsagesCount",
      render: (v) => (v === null || v === undefined ? "" : v.toLocaleString()),
      sorter: (a, b) => (a.prevUsagesCount || 0) - (b.prevUsagesCount || 0),
    },
    {
      title: "Usages",
      dataIndex: "usagesCount",
      key: "usagesCount",
      render: (v, record) => (
        <span style={{ color: record.flag === "zero" ? "#cf1322" : undefined }}>
          {v === null || v === undefined ? "" : v.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => (a.usagesCount || 0) - (b.usagesCount || 0),
    },
    {
      title: "Change",
      dataIndex: "change",
      key: "change",
      defaultSortOrder: "ascend",
      render: formatChange,
      sorter: (a, b) => (a.change ?? 0) - (b.change ?? 0),
    },
    {
      title: "Sync attempt",
      dataIndex: "attempt",
      key: "attempt",
      render: (attempt, record) =>
        record.prevAttempt && record.prevAttempt !== attempt
          ? `${record.prevAttempt} → ${attempt ?? ""}`
          : attempt,
    },
  ];

  const rows =
    flag === "all" ? data || [] : (data || []).filter((r) => r.flag === flag);

  return (
    <>
      {error && <Alert title={error.message} type="error" />}
      <Row style={{ marginBottom: "8px" }} gutter={8} align="middle">
        <Col>
          <Segmented
            value={flag}
            onChange={setFlag}
            options={[
              {
                label: `All (${(data || []).length})`,
                value: "all",
              },
              ...FLAGS.map((f) => ({
                label: `${f} (${(data || []).filter((r) => r.flag === f).length})`,
                value: f,
              })),
            ]}
          />
        </Col>
        <Col flex="auto" />
        <Col>
          Flag changes above{" "}
          <InputNumber
            min={0}
            max={100}
            value={minChange}
            onChange={(v) => setMinChange(v ?? 0)}
            addonAfter="%"
            style={{ width: "110px" }}
          />
        </Col>
      </Row>
      <Table
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 100, hideOnSinglePage: true }}
        rowKey="sectorKey"
      />
    </>
  );
};

const mapContextToProps = ({ user }) => ({ user });
export default withContext(mapContextToProps)(SectorsTab);
