import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";
import qs from "query-string";
import { Table, Alert, Input, Typography } from "antd";
import Layout from "../../components/LayoutNew";
import ErrorMsg from "../../components/ErrorMsg";
import history from "../../history";
import config from "../../config";

const PAGE_SIZE = 50;

/**
 * The GBIF publishers ChecklistBank knows, i.e. the organisations of its datasets
 * and of the users' organisation roles, from /publisher. Without a query the
 * publishers with most datasets come first. The query, sort and page live in
 * the URL.
 */
const Publishers = () => {
  const location = useLocation();
  const params = qs.parse(location.search);
  const q = params.q || "";
  const sortBy = params.sortBy || null;
  const page = Number(params.page) || 1;

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [term, setTerm] = useState(q);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    setLoading(true);
    axios(
      `${config.dataApi}publisher?${qs.stringify({
        q: q || undefined,
        sortBy: sortBy || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })}`,
    )
      .then((res) => {
        setData(res.data.result || []);
        setTotal(res.data.total || 0);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q, sortBy, page]);

  const push = (changes) =>
    history.push({
      pathname: location.pathname,
      search: qs.stringify(
        { q: q || undefined, sortBy: sortBy || undefined, page: page > 1 ? page : undefined, ...changes },
        { skipNull: true },
      ),
    });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: true,
      sortOrder: sortBy === "title" ? "ascend" : null,
      sortDirections: ["ascend"],
      render: (title, p) => (
        <NavLink to={{ pathname: `/publisher/${p.key}` }}>{title || p.key}</NavLink>
      ),
    },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "Country", dataIndex: "country", key: "country" },
    {
      title: "Datasets",
      dataIndex: "datasets",
      key: "datasets",
      align: "right",
      sorter: true,
      // without a query the API sorts by datasets anyway
      sortOrder: sortBy === "datasets" || (!sortBy && !q) ? "descend" : null,
      sortDirections: ["descend"],
      render: (n, p) =>
        n > 0 ? (
          <NavLink to={{ pathname: "/dataset", search: `?gbifPublisherKey=${p.key}` }}>
            {n.toLocaleString()}
          </NavLink>
        ) : (
          <Typography.Text type="secondary">0</Typography.Text>
        ),
    },
    {
      title: "GBIF",
      dataIndex: "key",
      key: "gbif",
      render: (key) => (
        <a href={`${config.gbifUrl}publisher/${key}`} target="_blank" rel="noreferrer">
          {key}
        </a>
      ),
    },
  ];

  return (
    <Layout openKeys={["admin"]} selectedKeys={["publisherAdmin"]} title="Publishers">
      <div style={{ background: "#fff", padding: 24, minHeight: 280, margin: "16px 0" }}>
        <p>
          The GBIF organisations ChecklistBank knows: the publishers of its datasets and the organisations users
          can edit or publish for. They are copied from the GBIF registry. Datasets are counted like the dataset
          search does, so private ones only when you can read them.
        </p>
        <Input.Search
          placeholder="Search publishers"
          allowClear
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onSearch={(v) => push({ q: v || undefined, sortBy: undefined, page: undefined })}
          style={{ maxWidth: 500, marginBottom: 10 }}
        />
        {error && (
          <Alert
            style={{ marginBottom: 10 }}
            type="error"
            description={<ErrorMsg error={error} />}
          />
        )}
        <Table
          size="small"
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            showTotal: (t) => `${t.toLocaleString()} publishers`,
          }}
          onChange={(pagination, filters, sorter, extra) => {
            if (extra?.action === "sort") {
              push({ sortBy: sorter?.order ? sorter.columnKey : undefined, page: undefined });
            } else {
              push({ page: pagination.current > 1 ? pagination.current : undefined });
            }
          }}
        />
      </div>
    </Layout>
  );
};

export default Publishers;
