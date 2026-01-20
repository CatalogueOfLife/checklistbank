import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Button, notification } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";

import SearchBox from "../DatasetList/SearchBox";
import withContext from "../../components/hoc/withContext";

const _ = require("lodash");

const PAGE_SIZE = 100;

const getWarningHighlightedNumber = (a, b) => {
  const numA = isNaN(a) ? 0 : Number(a);
  const numB = isNaN(b) ? 0 : Number(b);
  if (numA - numB === 0) {
    return numA;
  } else return <span style={{ color: "#ff4d4f" }}>{numA}</span>;
};

class DatasetList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      columns: [
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
                exact={true}
              >
                {text}
              </NavLink>
            );
          },
          // sorter: true
        },
        {
          title: "Title",
          dataIndex: "title",
          key: "title",
          render: (text, record) => {
            return (
              <NavLink
                to={{ pathname: `/dataset/${record.key}/names` }}
                exact={true}
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
          width: 410,
          key: "__actions__",
          render: (text, record) => (
            <React.Fragment>
              <Button
                type="primary"
                onClick={() => this.reindexDataset(record.key)}
              >
                Reindex
              </Button>&nbsp;
              <Button
                type="primary"
                onClick={() => this.rematchDataset(record.key)}
              >
                Rematch
              </Button>&nbsp;
              <Button
                type="primary"
                onClick={() => this.buildMatcher(record.key)}
              >
                BuildMatcher
              </Button>&nbsp;
              {!["xrelease", "release", "project"].includes(record.origin) && (
                <Button
                  type="primary"
                  onClick={() => this.reimportDataset(record.key)}
                  style={{ marginTop: "6px" }}
                >
                  Reimport
                </Button>
              )}
            </React.Fragment>
          ),
        },
      ],
      search: _.get(this.props, "location.search.q") || "",
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        showSizeChanger: false,
        current: 1,
        showQuickJumper: true,
      },

      loading: false,
    };
  }

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: "/admin/datasets",
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }

    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit,
          current: Number(params.offset) / Number(params.limit) + 1,
        },
      },
      this.getData
    );
  }

  getData = () => {
    const { params } = this.state;

    this.setState({ loading: true });
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: "/admin/datasets",
      search: `?${qs.stringify(params)}`,
    });
    axios(`${config.dataApi}dataset?${qs.stringify(params)}`)
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
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data.result,
          err: null,
          pagination,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params, offset: 0, limit: 50 };
    _.forEach(params, (v, k) => {
      if (typeof v !== "undefined" && v !== null) {
        newParams[k] = v;
      } else {
        delete newParams[k];
      }
    });
    this.setState({ params: newParams }, this.getData);
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination, ...pagination };
    // pager.current = pagination.current;

    this.setState({
      pagination: pager,
    });
    let query = {
      ...this.state.params,
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
    this.setState({ params: query }, this.getData);
  };

  reindexDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}admin/reindex?datasetKey=${datasetKey}`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Indexing started",
            description: `Dataset ${datasetKey} is being reindexed`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  rematchDataset = (datasetKey) => {
    axios
      .post(
        `${config.dataApi}admin/rematch?missingOnly=true&datasetKey=${datasetKey}`
      )
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Rematching started",
            description: `Dataset ${datasetKey} is being rematched`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  reimportDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}importer/${datasetKey}/reimport`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Reimport started",
            description: `Dataset ${datasetKey} is being reimported from last archive`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  buildMatcher = (datasetKey) => {
    axios
      .post(`${config.dataApi}admin/matcher/${datasetKey}`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Matcher job scheduled",
            description: `Matcher job building dataset ${datasetKey} scheduled.`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  render() {
    const { data, loading, error, columns } = this.state;
    const { datasetOrigin } = this.props;
    columns[3].filters = datasetOrigin.map((i) => ({
      text: _.startCase(i),
      value: i,
    }));

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
                  defaultValue={_.get(this.state, "params.q")}
                  style={{ marginBottom: "10px", width: "50%" }}
                  onSearch={(value) => this.updateSearch({ q: value })}
                />
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <Table
              size="middle"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={this.state.pagination}
              onChange={this.handleTableChange}
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

export default withContext(mapContextToProps)(DatasetList);
