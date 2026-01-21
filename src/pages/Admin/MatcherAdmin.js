import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Button, notification } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";

import withContext from "../../components/hoc/withContext";

const _ = require("lodash");


class MatcherList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      columns: [
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
                exact={true}
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
                exact={true}
              >
                {text}
              </NavLink>
            );
          },
        },
        {
          title: "Action",
          dataIndex: "",
          width: 200,
          key: "__actions__",
          render: (text, record) => (
            <React.Fragment>
              <Button
                type="primary"
                size="small"
                onClick={() => this.loadMatcher(record.datasetKey)}
              >
                Load
              </Button>&nbsp;
              <Button
                type="primary"
                size="small"
                onClick={() => this.reindexDataset(record.datasetKey)}
              >
                Rebuild
              </Button>&nbsp;
              <Button
                type="primary"
                color="danger"
                size="small"
                onClick={() => this.deleteDataset(record.datasetKey)}
              >
                Delete
              </Button>
            </React.Fragment>
          ),
        },
      ],
      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    this.setState({ loading: true });
    history.push({
      pathname: "/admin/matcher",
      search: `?decorate=true`,
    });
    axios(`${config.dataApi}admin/matcher?decorate=true`)
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data.matchers,
          err: null,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  loadMatcher = (datasetKey) => {
    axios
      .get(`${config.dataApi}admin/matcher/${datasetKey}`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Matcher loaded",
            description: `Matcher for dataset ${datasetKey} loaded from disk. ${res.size} records found.`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };
  
  reindexDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}admin/matcher/${datasetKey}`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Matcher build started",
            description: `Matcher for dataset ${datasetKey} is being created`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  deleteDataset = (datasetKey) => {
    axios
      .delete(`${config.dataApi}admin/matcher/${datasetKey}`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Matcher deleted",
            description: `Matcher for dataset ${datasetKey} is deleted`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  render() {
    const { data, loading, error, columns } = this.state;
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
            {error && <Alert message={error.message} type="error" />}
          </div>
          <h1>Dataset Matcher</h1>
          <p>Dataset matchers are file based indices of a dataset that is used for db independent matching services.</p>
          {!error && (
            <Table
              size="middle"
              pagination={false}
              columns={columns}
              dataSource={data}
              loading={loading}
              showSorterTooltip={{ target: 'sorter-icon' }}
            />
          )}
        </div>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, datasetOrigin }) => ({
  user,
  datasetOrigin,
});

export default withContext(mapContextToProps)(MatcherList);
