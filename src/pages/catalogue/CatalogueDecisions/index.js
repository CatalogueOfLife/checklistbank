import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Icon, Tooltip, Input, Button, Form, Select, Row, Col, Switch } from "antd";

import config from "../../../config";
import moment from "moment";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import kibanaQuery from "./kibanaQuery";
import Highlighter from "react-highlight-words";
import _ from "lodash"
import qs from "query-string";
import history from "../../../history";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import NameAutocomplete from "../Assembly/NameAutocomplete";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";

const FormItem = Form.Item;
const { Option } = Select;

const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const PAGE_SIZE = 100;

class SyncTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      searchText: "",
      loading: false,
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true
      }    };
  }

  componentDidMount() {
    // this.getData();
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(this.props, "location.pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`
      });
    }

    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit,
          current: Number(params.offset) / Number(params.limit) + 1,
          pageSize: PAGE_SIZE
        }
      },
      this.getData
    );
  }

  componentDidUpdate = prevProps => {
    if (
      _.get(prevProps, "location.search") !==
        _.get(this.props, "location.search") ||
      _.get(prevProps, "match.params.catalogueKey") !==
        _.get(this.props, "match.params.catalogueKey")
    ) {
      const params = qs.parse(_.get(this.props, "location.search"));
      this.setState(
        {
          pagination: {
            pageSize: params.limit,
            current: Number(params.offset) / Number(params.limit) + 1,
            pageSize: PAGE_SIZE
          }
        },
        this.getData
      );
    }
  };

  getData = () => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      datasetKey: catalogueKey
    };
    axios(`${config.dataApi}decision?${qs.stringify(params)}`)
      .then(this.decorateWithDataset)
      .then(res =>
        this.setState({
          loading: false,
          error: null,
          data: _.get(res, "data.result") || [],
          pagination: {
            ...this.state.pagination,
            total: _.get(res, "data.total")
          }
        })
      )
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  decorateWithDataset = res => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map(sector =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then(dataset => (sector.dataset = dataset))
      )
    ).then(() => res);
  };


  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize
    };

    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(params)
    });
  };

  updateSearch = params => {
    let newParams = {
      ...qs.parse(_.get(this.props, "location.search")),
      ...params,
      offset: 0
    };
    Object.keys(params).forEach(param => {
      if (params[param] === null) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams)
    });
  };
  onSelectDataset = dataset => {
    this.updateSearch({ subjectDatasetKey: dataset.key });
  };
  onResetDataset = () => {
    let newParams = qs.parse(_.get(this.props, "location.search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams)
    });
  };
  resetAllFilters = () => {
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`
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
    const { data, loading, error, pagination } = this.state;
    const {
      match: {
        params: { catalogueKey }
      },
      user,
      rank
    } = this.props;
    const params = qs.parse(_.get(this.props, "location.search"));

    const columns = [
      {
        title: "Dataset",
        dataIndex: "dataset.title",
        key: "title",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `catalogue/${catalogueKey}/dataset/${record.datasetKey}/metrics` }}
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
        title: "Mode",
        dataIndex: "mode",
        key: "mode",
        width: 50
      },
      {
        title: "Subject rank",
        dataIndex: "subject.rank",
        key: "rank",
        width: 50
      },
      {
        title: "Subject",
        dataIndex: "subject.name",
        key: "subject",
        width: 150,
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
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 50,
        render: date => {
          return date ? moment(date).format("lll") : "";
        }
      }
/*       ,
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
      } */
    ];

    return (
      <Layout
        selectedKeys={["catalogueDecisions"]}
        openKeys={["assembly"]}
        title="Decisions"
      >
        <PageContent>
          {error && <Alert 
          closable
          onClose={() => this.setState({ error: null })}
          message={error.message} type="error" />}
                    {error && (
            <Alert
              closable
              onClose={() => this.setState({ error: null })}
              message={error.message}
              type="error"
            />
          )}

          <Form layout="inline">
            <div style={{ marginBottom: "8px" }}>
              <DatasetAutocomplete
                onResetSearch={this.onResetDataset}
                onSelectDataset={this.onSelectDataset}
                contributesTo={this.props.catalogueKey}
                placeHolder="Source dataset"
              />
            </div>
           {/*  <div style={{ marginBottom: "8px" }}>
            <NameAutocomplete
              datasetKey={catalogueKey}
              onSelectName={name => {
                this.updateSearch({ name: name.title });
              }}
              onResetSearch={this.onResetName}
            />
            </div> */}
            <FormItem label="Only broken">
              <Switch
                checked={params.broken === true || params.broken === "true"}
                onChange={value => this.updateSearch({ broken: value })}
              />
            </FormItem>
            <FormItem label="Created by me">
              <Switch
                checked={user && Number(params.userKey) === user.key}
                onChange={value =>
                  this.updateSearch({ userKey: value ? user.key : null })
                }
              />
            </FormItem>
            <FormItem >
              <Select
                placeholder="Subject rank"
                style={{ width: 160 }}
                value={params.rank}
                showSearch
                onChange={value => this.updateSearch({ rank: value })}
              >
                {rank.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem >
              <Select
                              placeholder="Decision mode"

                style={{ width: 160 }}
                value={params.mode}
                showSearch
                onChange={value => this.updateSearch({ mode: value })}
              >
                {["block", "reviewed", "update", "update recursive"].map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
  
          </Form>
          <Row>
            <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Button type="danger" onClick={this.resetAllFilters}>
                Reset all
              </Button>
            </Col>
          </Row>
          {!error && (
            <Table
              size="small"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={pagination}
              rowKey="key"
              expandedRowRender={record => <pre>{JSON.stringify(record.subject,  null, 4)}</pre> }
              onChange={this.handleTableChange}
            />
          )}
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, rank }) => ({ user , rank});

export default withContext(mapContextToProps)(SyncTable);
