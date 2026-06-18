import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Button, Popconfirm, App } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";

import withContext from "../../components/hoc/withContext";

import _ from "lodash";

const columns = [
  {
    title: "Key",
    dataIndex: "datasetKey",
    width: 100,
    key: "key",
    sorter: (a, b) => a.datasetKey - b.datasetKey,
  },
  {
    title: "Size",
    dataIndex: "size",
    width: 150,
    key: "size",
    sorter: (a, b) => a.size - b.size,
  },
  {
    title: "Origin",
    dataIndex: ["dataset","origin"],
    width: 100,
    key: "origin",
    sorter: (a, b) => {
      if (!a.dataset.origin) {
          return -1;
      }
      if (!b.dataset.origin) {
          return +1;
      }
      return a.dataset.origin.localeCompare(b.dataset.origin);
    },
  },
  {
    title: "Alias",
    dataIndex: ["dataset","alias"],
    width: 150,
    key: "alias",
    sorter: (a, b) => {
      if (!a.dataset.alias) {
          return -1;
      }
      if (!b.dataset.alias) {
          return +1;
      }
      return a.dataset.alias.localeCompare(b.dataset.alias);
    },
    render: (text, record) => {
      return (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/names` }}
          end
        >
          {text}
        </NavLink>
      );
    },
  },
  {
    title: "Title",
    dataIndex: ["dataset","title"],
    key: "title",
    sorter: (a, b) => {
      if (!a.dataset.title) {
          return -1;
      }
      if (!b.dataset.title) {
          return +1;
      }
      return a.dataset.title.localeCompare(b.dataset.title);
    },
    render: (text, record) => {
      return (
        <NavLink
          to={{ pathname: `/dataset/${record.datasetKey}/names` }}
          end
        >
          {text}
        </NavLink>
      );
    },
  },
];

const MatcherList = () => {
  const { notification } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const getData = () => {
    setLoading(true);
    history.push({
      pathname: "/admin/matcher",
      search: `?decorate=true`,
    });
    axios(`${config.dataApi}matcher?decorate=true`)
      .then((res) => {
        setLoading(false);
        setData(res.data.matchers);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  const reindexDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}matcher/${datasetKey}`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "Matcher build started",
          description: `Matcher for dataset ${datasetKey} is being created`,
        });
      })
      .catch((err) => setError(err));
  };

  const deleteDataset = (datasetKey) => {
    axios
      .delete(`${config.dataApi}matcher/${datasetKey}`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "Matcher deleted",
          description: `Matcher for dataset ${datasetKey} is deleted`,
        });
      })
      .catch((err) => setError(err));
  };

  const rebuildAllMatchers = () => {
    axios
      .put(`${config.dataApi}rebuild?all=true`)
      .then(() => {
        setError(null);
        notification.open({
          message: "Rebuild triggered",
          description: "All matchers are being rebuilt",
        });
      })
      .catch((err) => setError(err));
  };

  const deleteAllMatchers = () => {
    axios
      .delete(`${config.dataApi}matcher?all=true`)
      .then(() => {
        setError(null);
        notification.open({
          message: "Matchers deleted",
          description: "All matchers are being deleted",
        });
        getData();
      })
      .catch((err) => setError(err));
  };

  const actionColumn = {
    title: "Action",
    dataIndex: "",
    width: 150,
    key: "__actions__",
    render: (text, record) => (
      <>
        <Button
          type="primary"
          size="small"
          onClick={() => reindexDataset(record.datasetKey)}
        >
          Rebuild
        </Button>&nbsp;
        <Button
          type="primary"
          color="danger"
          size="small"
          onClick={() => deleteDataset(record.datasetKey)}
        >
          Delete
        </Button>
      </>
    ),
  };

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["MatcherAdmin"]}
      title="Matcher Admin"
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 140,
          margin: "16px 0",
        }}
      >
        <div>
          {error && <Alert title={error.message} type="error" />}
        </div>
        <h1>Dataset Matcher</h1>
        <p>Dataset matchers are file based indices of a dataset that is used for db independent matching services.</p>
        <Row gutter={8} align="bottom" style={{ marginBottom: 16 }}>
          <Col flex="auto" style={{ maxWidth: 500 }}>
            <DatasetAutocomplete
              defaultDatasetKey={selectedDataset?.key || null}
              onResetSearch={() => setSelectedDataset(null)}
              onSelectDataset={(dataset) => setSelectedDataset(dataset)}
              placeHolder="Find a dataset to build a matcher for"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              disabled={!selectedDataset}
              onClick={() => selectedDataset && reindexDataset(selectedDataset.key)}
            >
              Build matcher
            </Button>
          </Col>
          <Col flex="auto" />
          <Col>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Popconfirm
                title="Do you want to rebuild all matchers?"
                onConfirm={rebuildAllMatchers}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" block>Rebuild all</Button>
              </Popconfirm>
              <Popconfirm
                title="Do you want to delete all matchers?"
                onConfirm={deleteAllMatchers}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger block>Delete all</Button>
              </Popconfirm>
            </div>
          </Col>
        </Row>
        {!error && (
          <Table
            size="middle"
            pagination={false}
            columns={[...columns, actionColumn]}
            dataSource={data}
            loading={loading}
            showSorterTooltip={{ target: 'sorter-icon' }}
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

export default withContext(mapContextToProps)(MatcherList);
