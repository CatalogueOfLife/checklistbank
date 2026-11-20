import { useState, useEffect } from "react";
import {
  Alert,
  Col,
  InputNumber,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import DataLoader from "dataloader";
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

// An xrelease has sectors from tens of thousands of source datasets - far too
// many keys for one /dataset/simple URL. Labels are resolved per rendered cell
// instead, so only the table page on screen is looked up, in batches small
// enough for a GET, and cached for paging back.
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids), {
  maxBatchSize: 100,
});

const SourceLabel = ({ datasetKey }) => {
  const [label, setLabel] = useState(null);
  useEffect(() => {
    let cancelled = false;
    datasetLoader
      .load(datasetKey)
      .then((d) => !cancelled && setLabel(d?.alias || d?.title || null));
    return () => {
      cancelled = true;
    };
  }, [datasetKey]);
  return (
    <NavLink to={{ pathname: `/dataset/${datasetKey}` }}>
      {label || datasetKey}
    </NavLink>
  );
};

// The extra segment listing the sectors the release was built from which
// contributed nothing to it. They are not in the sync comparison at all.
const NON_CONTRIBUTING = "noncontributing";

// A non contributing sector is no sector of the release, so it links to the
// sector in the dataset that holds it: the project, or the base release of an
// xrelease.
const projectSectorLink = (sector) => ({
  pathname: `/project/${sector.datasetKey}/sector`,
  search: `?key=${sector.id}`,
});

const formatChange = (change) =>
  change === null || change === undefined
    ? ""
    : `${change > 0 ? "+" : ""}${(change * 100).toFixed(1)} %`;

const SectorsTab = ({ datasetKey, previousReleaseKey, dataset, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minChange, setMinChange] = useState(10);
  const [flag, setFlag] = useState("all");
  const [nonContributing, setNonContributing] = useState(null);
  const [nonContributingSources, setNonContributingSources] = useState(null);
  const [nonContributingError, setNonContributingError] = useState(null);
  const [nonContributingView, setNonContributingView] = useState("sectors");

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
        setData(res.data || []);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [datasetKey, previousReleaseKey, minChange, mayQuery]);

  useEffect(() => {
    if (!mayQuery) return;
    let cancelled = false;
    setNonContributing(null);
    setNonContributingSources(null);
    Promise.all([
      axios(`${config.dataApi}dataset/${datasetKey}/sector/noncontributing`),
      axios(
        `${config.dataApi}dataset/${datasetKey}/sector/noncontributing/source`
      ),
    ])
      .then(([sectors, sources]) => {
        if (cancelled) return;
        setNonContributing(sectors.data || []);
        setNonContributingSources(sources.data || []);
        setNonContributingError(null);
      })
      .catch((err) => !cancelled && setNonContributingError(err));
    return () => {
      cancelled = true;
    };
  }, [datasetKey, mayQuery]);

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
      render: (key) => (key ? <SourceLabel datasetKey={key} /> : null),
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

  // Sources none of whose sectors contributed anything to the release.
  const unusedSources = new Set((nonContributingSources || []).map((s) => s.key));
  const sectorsById = Object.fromEntries(
    (nonContributing || []).map((s) => [s.id, s])
  );

  const nonContributingColumns = [
    {
      title: "Sector",
      dataIndex: "id",
      key: "id",
      render: (id, record) => (
        <NavLink to={projectSectorLink(record)}>{id}</NavLink>
      ),
      sorter: (a, b) => a.id - b.id,
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
          <Space size={4}>
            <SourceLabel datasetKey={key} />
            {unusedSources.has(key) && (
              <Tooltip title="No other sector, source or secondary source brought anything of this dataset into the release">
                <Tag color="red">contributed nothing</Tag>
              </Tooltip>
            )}
          </Space>
        ) : null,
      sorter: (a, b) => (a.subjectDatasetKey || 0) - (b.subjectDatasetKey || 0),
    },
    {
      title: "Subject",
      dataIndex: ["subject", "label"],
      key: "subject",
    },
    {
      title: "Target",
      dataIndex: ["target", "label"],
      key: "target",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      sorter: (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
    },
    {
      title: "Sync attempt",
      dataIndex: "syncAttempt",
      key: "syncAttempt",
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ellipsis: { showTitle: true },
    },
  ];

  const nonContributingSourceColumns = [
    {
      title: "Source",
      dataIndex: "key",
      key: "key",
      render: (key, record) => (
        <NavLink to={{ pathname: `/dataset/${key}` }}>
          {record.alias || key}
        </NavLink>
      ),
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Sectors",
      dataIndex: "sectorKeys",
      key: "sectorKeys",
      render: (keys) => (
        <Space size={4} wrap>
          {(keys || []).map((id) =>
            sectorsById[id] ? (
              <NavLink key={id} to={projectSectorLink(sectorsById[id])}>
                {id}
              </NavLink>
            ) : (
              <span key={id}>{id}</span>
            )
          )}
        </Space>
      ),
      sorter: (a, b) =>
        (a.sectorKeys || []).length - (b.sectorKeys || []).length,
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
              {
                label: `non contributing (${
                  nonContributing ? nonContributing.length : "…"
                })`,
                value: NON_CONTRIBUTING,
              },
            ]}
          />
        </Col>
        <Col flex="auto" />
        {flag === NON_CONTRIBUTING ? (
          <Col>
            <Segmented
              value={nonContributingView}
              onChange={setNonContributingView}
              options={[
                {
                  label: `Sectors (${(nonContributing || []).length})`,
                  value: "sectors",
                },
                {
                  label: `Sources contributing nothing (${
                    (nonContributingSources || []).length
                  })`,
                  value: "sources",
                },
              ]}
            />
          </Col>
        ) : (
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
        )}
      </Row>
      {flag === NON_CONTRIBUTING ? (
        <>
          {nonContributingError && (
            <Alert title={nonContributingError.message} type="error" />
          )}
          {nonContributingView === "sources" ? (
            <Table
              size="small"
              columns={nonContributingSourceColumns}
              dataSource={nonContributingSources || []}
              loading={!nonContributingSources && !nonContributingError}
              pagination={{ pageSize: 100, hideOnSinglePage: true }}
              rowKey="key"
            />
          ) : (
            <Table
              size="small"
              columns={nonContributingColumns}
              dataSource={nonContributing || []}
              loading={!nonContributing && !nonContributingError}
              pagination={{ pageSize: 100, hideOnSinglePage: true }}
              rowKey="id"
            />
          )}
        </>
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{ pageSize: 100, hideOnSinglePage: true }}
          rowKey="sectorKey"
        />
      )}
    </>
  );
};

const mapContextToProps = ({ user }) => ({ user });
export default withContext(mapContextToProps)(SectorsTab);
