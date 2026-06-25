import React, { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";

import { Table, Input, Descriptions, Tag, Alert, Typography } from "antd";

import config from "../../config";

const { Text } = Typography;

// renders the local example id as the full scope:id CURIE, linking to the
// resolved record when the scope has a resolver template
const ExampleCurie = ({ scope }) => {
  if (!scope.example) return <Text type="secondary">—</Text>;
  const curie = `${scope.scope}:${scope.example}`;
  if (scope.resolver) {
    const url = scope.resolver.replace("{id}", encodeURIComponent(scope.example));
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Text code>{curie}</Text>
      </a>
    );
  }
  return <Text code>{curie}</Text>;
};

// the full detail shown when a scope row is expanded
const ScopeDetail = ({ scope }) => {
  const items = [];
  items.push({
    key: "example",
    label: "Example",
    children: <ExampleCurie scope={scope} />,
  });
  if (scope.resolver) {
    items.push({
      key: "resolver",
      label: "Resolver",
      children: <Text code>{scope.resolver}</Text>,
    });
  }
  if (scope.link) {
    items.push({
      key: "link",
      label: "Homepage",
      children: (
        <a href={scope.link} target="_blank" rel="noopener noreferrer">
          {scope.link}
        </a>
      ),
    });
  }
  if (scope.regex) {
    items.push({
      key: "regex",
      label: "ID pattern",
      children: <Text code>{scope.regex}</Text>,
    });
  }
  if (scope.wikidataProperty) {
    items.push({
      key: "wikidataProperty",
      label: "Wikidata property",
      children: (
        <a
          href={`https://www.wikidata.org/wiki/Property:${scope.wikidataProperty}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {scope.wikidataProperty}
        </a>
      ),
    });
  }
  if (scope.datasetKey != null) {
    items.push({
      key: "datasetKey",
      label: "ChecklistBank dataset",
      children: <NavLink to={`/dataset/${scope.datasetKey}`}>{scope.datasetKey}</NavLink>,
    });
  }
  return (
    <Descriptions
      size="small"
      column={1}
      bordered
      items={items}
      style={{ maxWidth: 900 }}
    />
  );
};

const columns = [
  {
    title: "Scope",
    dataIndex: "scope",
    key: "scope",
    width: 160,
    sorter: (a, b) => a.scope.localeCompare(b.scope),
    render: (scope) => <Tag color="blue">{scope}</Tag>,
  },
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    width: 320,
    sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    render: (description) =>
      description || <Text type="secondary">—</Text>,
  },
];

const IdentifierScopeTable = () => {
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios(`${config.dataApi}vocab/identifier-scope`);
        if (!cancelled) {
          const data = (res.data || []).sort((a, b) =>
            a.scope.localeCompare(b.scope)
          );
          setScopes(data);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return scopes;
    return scopes.filter((s) =>
      [s.scope, s.title, s.description]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term))
    );
  }, [scopes, q]);

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load identifier scopes"
        description={String(error?.message || error)}
      />
    );
  }

  return (
    <>
      <Input.Search
        allowClear
        placeholder="Filter scopes by prefix, title or description"
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 480, marginBottom: 16 }}
      />
      <Table
        rowKey="scope"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        expandable={{
          expandedRowRender: (record) => <ScopeDetail scope={record} />,
        }}
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100, 250, 1000],
          showTotal: (total) => `${total} scopes`,
        }}
      />
    </>
  );
};

export default IdentifierScopeTable;
