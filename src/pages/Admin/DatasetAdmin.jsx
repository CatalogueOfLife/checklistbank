import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Button, App } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";

import SearchBox from "../DatasetList/SearchBox";
import withContext from "../../components/hoc/withContext";

import _ from "lodash";

const PAGE_SIZE = 100;

const getWarningHighlightedNumber = (a, b) => {
  const numA = isNaN(a) ? 0 : Number(a);
  const numB = isNaN(b) ? 0 : Number(b);
  if (numA - numB === 0) {
    return numA;
  } else return <span style={{ color: "#ff4d4f" }}>{numA}</span>;
};

const DatasetList = ({ datasetOrigin, location }) => {
  const { notification } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    showSizeChanger: false,
    current: 1,
    showQuickJumper: true,
  });

  const getData = (currentParams) => {
    const p = currentParams !== undefined ? currentParams : params;
    setLoading(true);
    if (!p.q) {
      delete p.q;
    }
    history.push({
      pathname: "/admin/datasets",
      search: `?${qs.stringify(p)}`,
    });
    axios(`${config.dataApi}dataset?${qs.stringify(p)}`)
      .then((res) => {
        return Promise.allSettled(
          !res.data.result
            ? []
            : [
                ...res.data.result.map((r) =>
                  axios(
                    `${config.dataApi}dataset/${r.key}/nameusage/search?limit=0`
                  ).then(
                    (nameusages) => (r.nameUsageTotal = nameusages.data.total)
                  )
                ),
                ...res.data.result.map((r) =>
                  axios(`${config.dataApi}dataset/${r.key}/matches/count`).then(
                    (count) => (r.matchesCount = count?.data)
                  )
                ),
              ]
        ).then(() => res);
      })
      .then((res) => {
        setPagination((prev) => ({ ...prev, total: res.data.total }));
        setLoading(false);
        setData(res.data.result);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    let initialParams = qs.parse(_.get({ location }, "location.search"));
    if (_.isEmpty(initialParams)) {
      initialParams = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: "/admin/datasets",
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    setParams(initialParams);
    setPagination((prev) => ({
      ...prev,
      pageSize: initialParams.limit,
      current: Number(initialParams.offset) / Number(initialParams.limit) + 1,
    }));
    getData(initialParams);
  }, []);

  const updateSearch = (newSearchParams) => {
    let newParams = { ...params, offset: 0, limit: 50 };
    _.forEach(newSearchParams, (v, k) => {
      if (typeof v !== "undefined" && v !== null) {
        newParams[k] = v;
      } else {
        delete newParams[k];
      }
    });
    setParams(newParams);
    getData(newParams);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    const pager = { ...pagination, ...newPagination };
    setPagination(pager);

    let query = {
      ...params,
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters,
      code: filters.code,
      format: filters.format,
    };
    if (sorter) {
      query.sortBy = sorter.field;
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    _.forEach(query, (v, k) => {
      if (typeof v !== "undefined" && v !== null) {
        query[k] = v;
      } else {
        delete query[k];
      }
    });
    setParams(query);
    getData(query);
  };

  const reindexDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}admin/reindex?datasetKey=${datasetKey}`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "Indexing started",
          description: `Dataset ${datasetKey} is being reindexed`,
        });
      })
      .catch((err) => setError(err));
  };

  const rematchDataset = (datasetKey) => {
    axios
      .post(
        `${config.dataApi}admin/rematch?missingOnly=true&datasetKey=${datasetKey}`
      )
      .then((res) => {
        setError(null);
        notification.open({
          message: "Rematching started",
          description: `Dataset ${datasetKey} is being rematched`,
        });
      })
      .catch((err) => setError(err));
  };

  const reimportDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}importer/${datasetKey}/reimport`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "Reimport started",
          description: `Dataset ${datasetKey} is being reimported from last archive`,
        });
      })
      .catch((err) => setError(err));
  };

  const buildMatcher = (datasetKey) => {
    axios
      .post(`${config.dataApi}matcher/${datasetKey}`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "Matcher job scheduled",
          description: `Matcher job building dataset ${datasetKey} scheduled.`,
        });
      })
      .catch((err) => setError(err));
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      width: 100,
      key: "key",
    },
    {
      title: "Alias",
      dataIndex: "alias",
      width: 200,
      key: "alias",
      render: (text, record) => {
        return (
          <NavLink
            to={{ pathname: `/dataset/${record.key}/names` }}
            end
          >
            {text}
          </NavLink>
        );
      },
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        return (
          <NavLink
            to={{ pathname: `/dataset/${record.key}/names` }}
            end
          >
            {text}
          </NavLink>
        );
      },
      sorter: true,
    },
    {
      title: "Origin",
      dataIndex: "origin",
      width: 100,
      key: "origin",
      filters: datasetOrigin
        ? datasetOrigin.map((i) => ({
            text: _.startCase(i),
            value: i,
          }))
        : [],
    },

    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 100,
      sorter: true,
      render: (text, record) =>
        record.origin !== "project"
          ? getWarningHighlightedNumber(record.size, record.nameUsageTotal)
          : record.size,
    },
    {
      title: "Indexed",
      dataIndex: "nameUsageTotal",
      key: "nameUsageTotal",
      width: 100,
      sorter: false,
      render: (text, record) =>
        record.origin !== "project"
          ? getWarningHighlightedNumber(record.nameUsageTotal, record.size)
          : record.nameUsageTotal,
    },
    {
      title: "Matched",
      dataIndex: "matchesCount",
      key: "matchesCount",
      width: 100,
      sorter: false,
    },
    {
      title: "Action",
      dataIndex: "",
      width: 350,
      key: "__actions__",
      render: (text, record) => (
        <>
          <Button
            type="primary"
            size="small"
            onClick={() => reindexDataset(record.key)}
          >
            Reindex
          </Button>&nbsp;
          <Button
            type="primary"
            size="small"
            onClick={() => rematchDataset(record.key)}
          >
            Rematch
          </Button>&nbsp;
          <Button
            type="primary"
            size="small"
            onClick={() => buildMatcher(record.key)}
          >
            BuildMatcher
          </Button>&nbsp;
          {!["xrelease", "release", "project"].includes(record.origin) && (
            <Button
              type="primary"
              size="small"
              onClick={() => reimportDataset(record.key)}
              style={{ marginTop: "6px" }}
            >
              Reimport
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["adminDatasets"]}
      title="Dataset Admin"
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <div>
          <Row style={{ marginBottom: "10px" }}>
            <Col md={12} sm={24}>
              <SearchBox
                defaultValue={params.q}
                style={{ marginBottom: "10px", width: "50%" }}
                onSearch={(value) => updateSearch({ q: value })}
              />
            </Col>
          </Row>
          {error && <Alert title={error.message} type="error" />}
        </div>
        {!error && (
          <Table
            size="middle"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
          />
        )}
      </div>
    </Layout>
  );
};

const mapContextToProps = ({ user, datasetOrigin }) => ({
  user,
  datasetOrigin,
});

export default withContext(mapContextToProps)(DatasetList);
