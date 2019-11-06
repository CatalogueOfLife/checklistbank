import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Icon, Tooltip, Input, Button } from "antd";
import config from "../../config";
import moment from "moment";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import kibanaQuery from "../SectorSync/kibanaQuery";
import Highlighter from "react-highlight-words";
import _ from "lodash"

class SyncTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      searchText: "",
      loading: false
    };
  }

  componentWillMount() {
    this.getDatasets().then(this.getData);
  }

  getDatasets = async () => {
    let last = false;
    let offset = 0;
    let limit = 100;
    let datasets = [];
    while (!last) {
      const d = await axios(
        `${config.dataApi}dataset?offset=${offset}&limit=${limit}`
      );
      datasets = [...datasets, ...d.data.result];
      offset += limit;
      last = d.data.last;
    }
    return datasets;
  };

  getData = datasets => {
    this.setState({ loading: true });

    Promise.all(
      datasets.map(d => {
        return axios(`${config.dataApi}decision/broken?datasetKey=${d.key}`).then(
          sectors => sectors.data.map(s => ({ ...s, dataset: d }))
        );
      })
    )
      .then(arrays => {
        const mergedArrays = arrays.reduce((a, b) => [...a, ...b]);
        console.log(mergedArrays)
        this.setState({ loading: false, error: null, data: mergedArrays });
      })

      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex.split('.')[0]}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => this.handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    }
  });
  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: "" });
  };
  render() {
    const { data, loading, error } = this.state;
    const columns = [
      {
        title: "Dataset",
        dataIndex: "dataset.title",
        key: "title",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/dataset/${record.datasetKey}/metrics` }}
              exact={true}
            >
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
              />
            </NavLink>
          );
        },
        sorter: (a, b) => a.dataset.title < b.dataset.title,
        width: 250,
        ...this.getColumnSearchProps("dataset.title")
      },
      {
        title: "Subject",
        dataIndex: "subject.name",
        key: "subject",
        width: 150,
        sorter: (a, b) => a.subject.name < b.subject.name,
        ...this.getColumnSearchProps("subject.name"),
        render: (text, record) => {
          return (
            <React.Fragment>
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record.subject.rank}:{" "}
              </span>
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={record.subject.name.toString()}
              />
            </React.Fragment>
          );
        }
      },
      {
        title: "Target",
        dataIndex: "target.name",
        key: "target",
        width: 150,
        ...this.getColumnSearchProps("target.name"),

        sorter: (a, b) => a.target.name < b.target.name,

        render: (text, record) => {
          return (
            <React.Fragment>
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record.target.rank}:{" "}
              </span>
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={record.target.name.toString()}
              />
            </React.Fragment>
          );
        }
      },

      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 50,
        sorter: (a, b) => a.created < b.created,
        render: date => {
          return date ? moment(date).format("lll") : "";
        }
      },
      {
        title: "Modified",
        dataIndex: "modified",
        key: "modified",
        width: 50,
        sorter: (a, b) => a.modified < b.modified,
        render: date => {
          return date ? moment(date).format("lll") : "";
        }
      },
      {
        title: "Logs",
        key: "logs",
        render: (text, record) => (
          <Tooltip title="Kibana logs">
            <a href={kibanaQuery(record.key)} target="_blank" >
              <Icon type="code" style={{ fontSize: "20px" }} />
            </a>
          </Tooltip>
        ),
        width: 50
      }
    ];

    return (
      <Layout
        selectedKeys={["sectorBroken"]}
        openKeys={["assembly"]}
        title="Broken sectors"
      >
        <PageContent>
          {error && <Alert 
          closable
          onClose={() => this.setState({ error: null })}
          message={error.message} type="error" />}
          {!error && (
            <Table
              size="small"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={{ pageSize: 100 }}
              rowKey="key"
            />
          )}
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(SyncTable);
