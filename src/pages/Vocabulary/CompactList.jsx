import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ConfigProvider, Input, Table, Typography } from "antd";
import { Link } from "react-router-dom";

const { Text } = Typography;

const LIST_HEIGHT = 560;
// Tighter rows than antd's small table, and only the visible ones are rendered,
// so even the 63,910 entries of mrgid stay responsive.
const COMPACT_THEME = {
  components: { Table: { cellPaddingBlockSM: 1, cellPaddingInlineSM: 8 } },
};

// rows: [{ id, label }], with an empty label for lists of identifiers only.
// linkTo: optional function giving the path a row links to.
const CompactList = ({ rows, linkTo, idTitle = "id", labelTitle = "label" }) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const table = useRef(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.id.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
    );
  }, [rows, deferredQuery]);

  useEffect(() => {
    table.current?.scrollTo?.({ top: 0 });
  }, [filtered]);

  const hasLabels = useMemo(() => rows.some((r) => r.label), [rows]);
  const columns = useMemo(() => {
    const idColumn = {
      title: idTitle,
      dataIndex: "id",
      ellipsis: true,
      render: (id, row) => (linkTo ? <Link to={linkTo(row)}>{id}</Link> : id),
    };
    if (!hasLabels) return [idColumn];
    return [
      // Only this column may have a width: a virtual table collapses % widths.
      { ...idColumn, width: 140 },
      { title: labelTitle, dataIndex: "label", ellipsis: true },
    ];
  }, [hasLabels, linkTo, idTitle, labelTitle]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Filter"
          aria-label="Filter entries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Text type="secondary">
          {filtered.length === rows.length
            ? `${rows.length.toLocaleString("en")} entries`
            : `${filtered.length.toLocaleString("en")} of ${rows.length.toLocaleString("en")} entries`}
        </Text>
      </div>
      <ConfigProvider theme={COMPACT_THEME}>
        <Table
          ref={table}
          virtual
          size="small"
          rowKey="id"
          pagination={false}
          columns={columns}
          dataSource={filtered}
          scroll={{ y: LIST_HEIGHT }}
        />
      </ConfigProvider>
    </div>
  );
};

export default CompactList;
