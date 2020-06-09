import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import Auth from "../../../components/Auth";
import { debounce } from "lodash";

import {
  Table,
  Alert,
  Popconfirm,
  Input,
  Button,
  Select,
  Row,
  Col,
  Switch,
  Form,
  notification,
} from "antd";

import config from "../../../config";
import moment from "moment";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import kibanaQuery from "./kibanaQuery";
import Highlighter from "react-highlight-words";
import _ from "lodash";
import qs from "query-string";
import history from "../../../history";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import NameAutocomplete from "../Assembly/NameAutocomplete";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import RematchResult from "../CatalogueSectors/RematchResult";

const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const PAGE_SIZE = 100;

class CatalogueDecisions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      searchText: "",
      loading: false,
      rematchDecisionsLoading: false,
      rematchInfo: null,
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
      },
    };
  }
  nameRef = React.createRef();

  componentDidMount() {
    // this.getData();
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(this.props, "location.pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }

    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit,
          current: Number(params.offset) / Number(params.limit) + 1,
          pageSize: PAGE_SIZE,
        },
      },
      this.getData
    );
  }

  componentDidUpdate = (prevProps) => {
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
            pageSize: PAGE_SIZE,
          },
        },
        this.getData
      );
    }
  };

  getData = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
    };
    axios(
      `${config.dataApi}dataset/${catalogueKey}/decision?${qs.stringify(
        params
      )}`
    )
      .then(this.decorateWithDataset)
      .then((res) =>
        this.setState({
          loading: false,
          error: null,
          data: _.get(res, "data.result") || [],
          pagination: {
            ...this.state.pagination,
            total: _.get(res, "data.total"),
          },
        })
      )
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  decorateWithDataset = (res) => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map((sector) =>
        datasetLoader
          .load(sector.subjectDatasetKey)
          .then((dataset) => (sector.dataset = dataset))
      )
    ).then(() => res);
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
    };

    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(params),
    });
  };

  updateSearch = (params) => {
    let newParams = {
      ...qs.parse(_.get(this.props, "location.search")),
      ...params,
      offset: 0,
    };
    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams),
    });
  };

  onSelectDataset = (dataset) => {
    this.updateSearch({ subjectDatasetKey: dataset.key });
  };

  onResetDataset = () => {
    let newParams = qs.parse(_.get(this.props, "location.search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: qs.stringify(newParams),
    });
  };

  resetAllFilters = () => {
    this.nameRef.current.input.state.value = "";

    history.push({
      pathname: _.get(this.props, "location.pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
  };

  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = (clearFilters) => {
    clearFilters();
    this.setState({ searchText: "" });
  };

  rematchDecisions = (subjectDatasetKey) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ rematchDecisionsLoading: true });
    const body = subjectDatasetKey ? { subjectDatasetKey } : {};
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/decision/rematch`, body)
      .then((res) => {
        this.setState({
          rematchDecisionsLoading: false,
          error: null,
          rematchInfo: { decisions: res.data },
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          rematchInfo: null,
          rematchDecisionsLoading: false,
        })
      );
  };
  render() {
    const {
      data,
      loading,
      error,
      pagination,
      rematchDecisionsLoading,
      rematchInfo,
    } = this.state;
    const {
      match: {
        params: { catalogueKey },
      },
      user,
      rank,
    } = this.props;
    const params = qs.parse(_.get(this.props, "location.search"));

    const columns = [
      {
        title: "Dataset",
        dataIndex: ["dataset", "title"],
        key: "title",
        render: (text, record) => {
          return (
            <NavLink
              to={{
                pathname: `catalogue/${catalogueKey}/dataset/${record.datasetKey}/imports`,
              }}
              exact={true}
            >
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
              />
            </NavLink>
          );
        },
        sorter: (a, b) => a.dataset.title < b.dataset.title,
        width: 250,
      },
      {
        title: "Mode",
        dataIndex: "mode",
        key: "mode",
        width: 50,
      },
      {
        title: "Subject rank",
        dataIndex: ["subject", "rank"],
        key: "rank",
        width: 50,
      },
      {
        title: "Subject",
        dataIndex: ["subject", "name"],
        key: "subject",
        width: 150,
        render: (text, record) => {
          return (
            <React.Fragment>
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record.subject.rank}:{" "}
              </span>
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={record.subject.name.toString()}
              />
            </React.Fragment>
          );
        },
      },

      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 50,
        render: (date) => {
          return date ? moment(date).format("lll") : "";
        },
      },
    ];

    if (Auth.isAuthorised(user, ["admin", "editor"])) {
      columns.push({
        title: "Action",
        key: "action",
        width: 250,
        render: (text, record) => (
          <React.Fragment>
            {
              <Button
                style={{ display: "inline", marginRight: "8px" }}
                type={"primary"}
                onClick={() => {
                  axios
                    .post(
                      `${config.dataApi}dataset/${catalogueKey}/decision/rematch`,
                      { id: record.id }
                    )
                    .then((rematchInfo) => {
                      const success =
                        (_.get(rematchInfo, "data.updated") === 1 ||
                          _.get(rematchInfo, "data.unchanged") === 1) &&
                        _.get(rematchInfo, "data.broken") === 0;

                      if (success) {
                        notification.success({
                          message: "Rematch success",
                          description: `Updated: ${_.get(
                            rematchInfo,
                            "data.updated"
                          )} Unchanged: ${_.get(
                            rematchInfo,
                            "data.unchanged"
                          )}`,
                        });
                      } else {
                        notification.error({
                          message: "Rematch failed",
                          description: `Broken decisions: 1`,
                        });
                      }
                    })
                    .catch((err) => {
                      notification.error({
                        message: `Server error ${_.get(
                          err,
                          "response.status"
                        )}`,
                        description: _.get(err, "response.data.message"),
                      });
                    });
                }}
              >
                Rematch
              </Button>
            }
            {
              <Button
                style={{ display: "inline" }}
                type="danger"
                onClick={() => {
                  return axios
                    .delete(
                      `${config.dataApi}dataset/${catalogueKey}/decision/${record.id}`
                    )
                    .then((res) => {
                      this.setState(
                        {
                          data: this.state.data.filter(
                            (d) => d.id !== record.id
                          ),
                        },
                        () =>
                          notification.open({
                            message: "Decision deleted",
                          })
                      );
                    });
                }}
              >
                <DeleteOutlined />
              </Button>
            }
          </React.Fragment>
        ),
      });
    }

    return (
      <Layout
        selectedKeys={["catalogueDecisions"]}
        openKeys={["assembly", "projectDetails"]}
        title="Decisions"
      >
        <PageContent>
          {error && (
            <Alert
              closable
              onClose={() => this.setState({ error: null })}
              message={error.message}
              type="error"
            />
          )}
          {rematchInfo && (
            <Alert
              closable
              onClose={() => this.setState({ rematchInfo: null })}
              message="Rematch succeded"
              description={<RematchResult rematchInfo={rematchInfo} />}
              type="success"
              style={{ marginBottom: "10px" }}
            />
          )}

          <Form layout="inline">
            <FormItem>
              <div style={{ marginBottom: "8px", marginRight: "8px" }}>
                <DatasetAutocomplete
                  defaultDatasetKey={_.get(params, "subjectDatasetKey") || null}
                  onResetSearch={this.onResetDataset}
                  onSelectDataset={this.onSelectDataset}
                  contributesTo={this.props.catalogueKey}
                  placeHolder="Source dataset"
                />
              </div>
            </FormItem>
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Search
                placeholder="Taxon name"
                defaultValue={params.name}
                onSearch={(value) => this.updateSearch({ name: value })}
                style={{ width: 200 }}
                ref={this.nameRef}
                allowClear
              />
            </FormItem>

            <FormItem
              label="Only broken"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                checked={params.broken === true || params.broken === "true"}
                onChange={(value) => this.updateSearch({ broken: value })}
              />
            </FormItem>
            <FormItem
              label="Created by me"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                checked={user && Number(params.modifiedBy) === user.key}
                onChange={(value) =>
                  this.updateSearch({ modifiedBy: value ? user.key : null })
                }
              />
            </FormItem>
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Select
                placeholder="Subject rank"
                style={{ width: 160 }}
                value={params.rank}
                showSearch
                allowClear
                onChange={(value) => this.updateSearch({ rank: value })}
              >
                {rank.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
              <Select
                placeholder="Decision mode"
                style={{ width: 160 }}
                value={params.mode}
                showSearch
                allowClear
                onChange={(value) => this.updateSearch({ mode: value })}
              >
                {["block", "reviewed", "update", "update recursive"].map(
                  (r) => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  )
                )}
              </Select>
            </FormItem>
          </Form>
          <Row>
            <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Button type="danger" onClick={this.resetAllFilters}>
                Reset all
              </Button>
            </Col>
            <Col style={{ textAlign: "right" }}>
              <Popconfirm
                placement="rightTop"
                title="Do you want to rematch all decisions?"
                onConfirm={() => this.rematchDecisions(params.subjectDatasetKey)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  loading={rematchDecisionsLoading}
                  style={{ marginLeft: "10px", marginBottom: "10px" }}
                >
                  Rematch all decisions {params.subjectDatasetKey ? ` from dataset ${params.subjectDatasetKey}`: ''}
                </Button>
              </Popconfirm>
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
              expandedRowRender={(record) => (
                <pre>{JSON.stringify(record.subject, null, 4)}</pre>
              )}
              onChange={this.handleTableChange}
            />
          )}
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, rank }) => ({ user, rank });

export default withContext(mapContextToProps)(CatalogueDecisions);
