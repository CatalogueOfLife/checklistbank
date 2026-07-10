import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";
import { Button, Row, Col, Tooltip, Table, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import axios from "axios";
import config from "../../config";
import Classification from "../NameSearch/Classification";
import TaxGroupIcon from "../NameSearch/TaxGroupIcon";
import { resizableComponents, useResizableColumns } from "./resizableColumns";

const limit = 500;

const SYNONYM_STATUS = ["synonym", "ambiguous synonym", "misapplied"];

// Link to the usage in its source dataset. Accepted usages link to their own
// taxon page; synonyms resolve to the accepted taxon via the parent id.
const usageUri = (record) => {
  const target =
    SYNONYM_STATUS.includes(record?.status) && record?.parentId
      ? record.parentId
      : record?.id;
  return `/dataset/${record?.datasetKey}/taxon/${encodeURIComponent(target)}`;
};

// Prefer "{alias}: {title}" — the alias is the most recognizable disambiguator
// between releases — falling back to the title alone. The title is rendered in
// a smaller font; the alias stays at the regular size.
const datasetTitleStyle = { fontSize: "0.85em" };
const datasetLabel = (record) =>
  record?.datasetAlias ? (
    <>
      {record.datasetAlias}:{" "}
      <span style={datasetTitleStyle}>{record.datasetTitle}</span>
    </>
  ) : (
    <span style={datasetTitleStyle}>{record?.datasetTitle}</span>
  );
const datasetLabelText = (record) =>
  record?.datasetAlias
    ? `${record.datasetAlias}: ${record.datasetTitle}`
    : record?.datasetTitle;

// Render the expanded classification smaller and indented further than the
// dataset title in the row above it.
const classificationStyle = { fontSize: "x-small", paddingLeft: "3rem" };

// Plain scientific name + authorship, used for alphabetical sorting of the
// name column (the response only carries the HTML label, no plain `label`).
const plainLabel = (record) =>
  [record?.name, record?.authorship].filter(Boolean).join(" ");

// Build antd column filter options from the loaded rows: one distinct entry per
// value, ordered by `sortBy` (numeric or string).
const buildFilters = (rows, valueOf, textOf, sortBy) => {
  const map = new Map();
  rows.forEach((r) => {
    const value = valueOf(r);
    if (value != null && value !== "" && !map.has(value)) {
      map.set(value, { value, text: textOf(r), _sort: sortBy(r) });
    }
  });
  return Array.from(map.values())
    .sort((a, b) =>
      typeof a._sort === "number" && typeof b._sort === "number"
        ? a._sort - b._sort
        : String(a._sort).localeCompare(String(b._sort))
    )
    .map(({ value, text }) => ({ value, text }));
};

const RelatedNames = ({ match, addError, rank }) => {
  const [related, setRelated] = useState({ result: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setRelated({ result: [] });
      const {
        params: { key },
      } = match;
      try {
        const res = await axios(
          `${config.dataApi}nidx/${key}/usages?limit=${limit}`
        );
        if (res?.data) {
          setRelated(res.data);
        }
      } catch (err) {
        addError(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [match?.params?.key]);

  const loadMore = async () => {
    setLoading(true);
    const {
      params: { key },
    } = match;
    try {
      const offset = related.offset + related.limit;
      const res = await axios(
        `${config.dataApi}nidx/${key}/usages?offset=${offset}&limit=${limit}`
      );
      if (res?.data) {
        setRelated({
          ...res.data,
          result: [...related.result, ...(res.data.result || [])],
        });
      }
    } catch (err) {
      addError(err);
    } finally {
      setLoading(false);
    }
  };

  const rows = related?.result || [];
  const rankOrder = (r) => (rank || []).indexOf(r);

  const columns = [
    {
      title: "Dataset",
      dataIndex: "datasetTitle",
      key: "datasetLabel",
      width: 260,
      ellipsis: { showTitle: false },
      render: (text, record) => (
        <Tooltip title={datasetLabelText(record)}>
          <NavLink to={{ pathname: usageUri(record) }} end>
            {datasetLabel(record)}
          </NavLink>
        </Tooltip>
      ),
    },
    {
      title: "Group",
      dataIndex: "group",
      key: "group",
      width: 70,
      align: "center",
      filters: buildFilters(
        rows,
        (r) => r.group,
        (r) => (
          <>
            <TaxGroupIcon group={r.group} size={16} /> {r.group}
          </>
        ),
        (r) => r.group
      ),
      onFilter: (value, record) => record.group === value,
      sorter: (a, b) => (a.group || "").localeCompare(b.group || ""),
      render: (group) =>
        group ? <TaxGroupIcon group={group} size={20} /> : null,
    },
    {
      title: "Scientific Name",
      dataIndex: ["labelHtml"],
      key: "scientificName",
      width: 320,
      filters: buildFilters(
        rows,
        (r) => r.labelHtml,
        (r) => <span dangerouslySetInnerHTML={{ __html: r.labelHtml }} />,
        (r) => plainLabel(r)
      ),
      onFilter: (value, record) => record.labelHtml === value,
      sorter: (a, b) => plainLabel(a).localeCompare(plainLabel(b)),
      render: (text) => <span dangerouslySetInnerHTML={{ __html: text }} />,
    },
    {
      title: "Status",
      dataIndex: ["status"],
      key: "status",
      width: 220,
      filters: buildFilters(
        rows,
        (r) => r.status,
        (r) => r.status,
        (r) => r.status
      ),
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (text, record) =>
        SYNONYM_STATUS.includes(text) && record.accepted?.labelHtml ? (
          <>
            {text} {text === "misapplied" ? "to " : "of "}
            <span
              dangerouslySetInnerHTML={{ __html: record.accepted.labelHtml }}
            />
          </>
        ) : (
          text
        ),
    },
    {
      title: "Rank",
      dataIndex: ["rank"],
      key: "rank",
      width: 100,
      filters: buildFilters(
        rows,
        (r) => r.rank,
        (r) => r.rank,
        (r) => rankOrder(r.rank)
      ),
      onFilter: (value, record) => record.rank === value,
      sorter: (a, b) => rankOrder(a.rank) - rankOrder(b.rank),
    },
  ];

  const resizableCols = useResizableColumns(columns);

  return (
    <>
      <Typography.Paragraph type="secondary">
        All name usages across every ChecklistBank dataset that share this name,
        linked via the names index.
      </Typography.Paragraph>
      <Table
        size="small"
        components={resizableComponents}
        columns={resizableCols}
        dataSource={rows}
        loading={loading}
        rowKey={(record) => `${record.datasetKey}_${record.id}`}
        pagination={false}
        expandable={{
          rowExpandable: (record) => Boolean(record?.classification?.length),
          expandedRowRender: (record) => (
            <div style={classificationStyle}>
              <Classification
                classification={record.classification}
                baseUri={`/dataset/${record.datasetKey}`}
              />
            </div>
          ),
        }}
      />
      {!related?.last && related?.result?.length > 0 && (
        <Row>
          <Col flex="auto" />
          <Col>
            <Button type="link" onClick={loadMore}>
              Load more
            </Button>
          </Col>
        </Row>
      )}
    </>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });
export default withContext(mapContextToProps)(withRouter(RelatedNames));
