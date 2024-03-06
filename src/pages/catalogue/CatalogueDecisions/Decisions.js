import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  DeleteOutlined,
  WarningOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Auth from "../../../components/Auth";

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
import { withRouter } from "react-router-dom";
import config from "../../../config";
import moment from "moment";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import Highlighter from "react-highlight-words";
import _ from "lodash";
import qs from "query-string";
import history from "../../../history";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import { getDatasetsBatch } from "../../../api/dataset";
import { getUsersBatch } from "../../../api/user";
import DataLoader from "dataloader";
import RematchResult from "../CatalogueSectors/RematchResult";
import DecisionForm from "../../WorkBench/DecisionForm";
const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

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
      decisionFormVisible: false,
      rowsForEdit: [],
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
          pageSize: params.limit || PAGE_SIZE,
          current:
            Number(params.offset) / Number(params.limit || PAGE_SIZE) + 1,
        },
      },
      this.getData
    );
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "location.search") !==
        _.get(this.props, "location.search") ||
      _.get(prevProps, "datasetKey") !== _.get(this.props, "datasetKey")
    ) {
      const params = qs.parse(_.get(this.props, "location.search"));
      this.setState(
        {
          pagination: {
            pageSize: params.limit || PAGE_SIZE,
            current:
              Number(params.offset) / Number(params.limit || PAGE_SIZE) + 1,
          },
        },
        this.getData
      );
    }
  };

  getData = () => {
    const { datasetKey } = this.props;
    this.setState({ loading: true });
    const params = {
      ...qs.parse(_.get(this.props, "location.search")),
    };
    const url = !!params.stale
      ? `${config.dataApi}dataset/${datasetKey}/decision/stale${
          !!params.subjectDatasetKey
            ? "?subjectDatasetKey=" + params.subjectDatasetKey
            : ""
        }`
      : `${config.dataApi}dataset/${datasetKey}/decision?${qs.stringify(
          params
        )}`;
    axios(url)
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
    return Promise.all([
      ...res.data.result.map((decision) =>
        datasetLoader
          .load(decision.subjectDatasetKey)
          .then((dataset) => (decision.dataset = dataset))
      ),
      ...res.data.result.map((decision) =>
        userLoader
          .load(decision.createdBy)
          .then((user) => (decision.user = user))
      ),
    ]).then(() => res);
  };

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination, ...pagination };
    //pager.current = pagination.current;

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
    if (this?.nameRef?.current?.input?.state?.value) {
      this.nameRef.current.input.state.value = "";
    }

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
    const { datasetKey } = this.props;

    this.setState({ rematchDecisionsLoading: true });
    const body = subjectDatasetKey ? { subjectDatasetKey } : {};
    axios
      .post(`${config.dataApi}dataset/${datasetKey}/decision/rematch`, body)
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

  deleteBrokenDecisions = (subjectDatasetKey) => {
    const { datasetKey } = this.props;

    this.setState({ deleteBrokenDecisionsLoading: true });
    axios
      .delete(
        `${config.dataApi}dataset/${datasetKey}/decision?datasetKey=${subjectDatasetKey}&broken=true`
      )
      .then((res) => {
        notification.success({
          message: "Success",
          description: `Deleted ${res} broken decisions`,
        });
        this.setState({
          deleteBrokenDecisionsLoading: false,
          error: null,
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          deleteBrokenDecisionsLoading: false,
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
      deleteBrokenDecisionsLoading,
      rematchInfo,
      decisionFormVisible,
      rowsForEdit,
    } = this.state;
    const { datasetKey, user, rank, decisionMode, type, releasedFrom } =
      this.props;
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
                pathname: `/catalogue/${
                  type === "project" ? datasetKey : releasedFrom
                }/dataset/${record.subjectDatasetKey}/imports`,
              }}
              exact={true}
            >
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={record?.alias?.toString() || text.toString()}
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
              <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {record?.subject?.rank}:{" "}
              </div>
              {!record?.subject?.id && (
                <NavLink
                  to={{
                    pathname: `/dataset/${record.subjectDatasetKey}/names`,
                    search: `?q=${record?.subject?.name}`,
                  }}
                  exact={true}
                >
                  <Highlighter
                    highlightStyle={{ fontWeight: "bold", padding: 0 }}
                    searchWords={[params.name]}
                    autoEscape
                    textToHighlight={record?.subject?.name?.toString()}
                  />
                </NavLink>
              )}
              {record?.subject?.id && (
                <NavLink
                  to={{
                    pathname: `/catalogue/${
                      type === "project" ? datasetKey : releasedFrom
                    }/dataset/${record.subjectDatasetKey}/taxon/${
                      record?.subject?.id
                    }`,
                  }}
                  exact={true}
                >
                  <Highlighter
                    highlightStyle={{ fontWeight: "bold", padding: 0 }}
                    searchWords={[params.name]}
                    autoEscape
                    textToHighlight={
                      _.get(record, "subject.name")
                        ? record?.subject?.name.toString()
                        : ""
                    }
                  />
                </NavLink>
              )}
              {record?.subject?.broken && (
                <WarningOutlined style={{ color: "red", marginLeft: "10px" }} />
              )}
            </React.Fragment>
          );
        },
      },
      {
        title: "Created by",
        dataIndex: ["user", "username"],
        key: "createdBy",
      },

      {
        title: "Created",
        dataIndex: "created",
        key: "created",
        width: 100,
        render: (date) => {
          return date ? moment(date).format("l LT") : "";
        },
      },
    ];

    if (
      Auth.canEditDataset({ key: datasetKey }, user) &&
      this.props?.type === "project"
    ) {
      columns.push({
        title: "Action",
        key: "action",
        width: 250,
        render: (text, record) => (
          <React.Fragment>
            {
              <Button
                size="small"
                style={{ display: "inline", marginRight: "8px" }}
                type={"primary"}
                onClick={() => {
                  axios
                    .post(
                      `${config.dataApi}dataset/${datasetKey}/decision/rematch`,
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
                size="small"
                style={{ display: "inline" }}
                type="danger"
                onClick={() => {
                  return axios
                    .delete(
                      `${config.dataApi}dataset/${datasetKey}/decision/${record.id}`
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
      <>
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
        {decisionFormVisible && (
          <DecisionForm
            rowsForEdit={rowsForEdit}
            onCancel={() => {
              this.setState({
                decisionFormVisible: false,
                rowsForEdit: [],
              });
            }}
            onOk={() => {
              this.setState({
                decisionFormVisible: false,
                rowsForEdit: [],
              });
            }}
            onSaveDecision={(name) => {
              this.setState(
                {
                  decisionFormVisible: false,
                  rowsForEdit: [],
                },
                this.getData
              );
            }}
            datasetKey={datasetKey}
            subjectDatasetKey={_.get(
              rowsForEdit,
              "[0].decisions[0].subjectDatasetKey",
              null
            )}
          />
        )}

        <Form layout="inline">
          <FormItem>
            <div style={{ marginBottom: "8px", marginRight: "8px" }}>
              <DatasetAutocomplete
                defaultDatasetKey={_.get(params, "subjectDatasetKey") || null}
                onResetSearch={this.onResetDataset}
                onSelectDataset={this.onSelectDataset}
                contributesTo={this.props.datasetKey}
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
            label="Stale"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            <Switch
              checked={params.stale === true || params.stale === "true"}
              onChange={(value) => this.updateSearch({ stale: value })}
            />
          </FormItem>
          <FormItem
            label="Only broken"
            style={{ marginBottom: "8px", marginRight: "8px" }}
          >
            <Switch
              disabled={params.stale === true || params.stale === "true"}
              checked={params.broken === true || params.broken === "true"}
              onChange={(value) => this.updateSearch({ broken: value })}
            />
          </FormItem>
          {Auth.canEditDataset({ key: datasetKey }, user) && (
            <FormItem
              label="Created by me"
              style={{ marginBottom: "8px", marginRight: "8px" }}
            >
              <Switch
                disabled={params.stale === true || params.stale === "true"}
                checked={user && Number(params.modifiedBy) === user.key}
                onChange={(value) =>
                  this.updateSearch({ modifiedBy: value ? user.key : null })
                }
              />
            </FormItem>
          )}

          <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
            <Select
              disabled={params.stale === true || params.stale === "true"}
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
              disabled={params.stale === true || params.stale === "true"}
              placeholder="Decision mode"
              style={{ width: 160 }}
              value={params.mode}
              showSearch
              allowClear
              onChange={(value) => this.updateSearch({ mode: value })}
            >
              {decisionMode.map((r) => (
                <Option key={r.name} value={r.name}>
                  {r.name}
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
          <Col flex="auto"></Col>
          {Auth.canEditDataset({ key: datasetKey }, user) &&
            this.props?.type === "project" && (
              <Col style={{ textAlign: "right" }}>
                <Popconfirm
                  placement="rightTop"
                  title={
                    params.subjectDatasetKey
                      ? `Do you want to rematch all decisions from source dataset ${params.subjectDatasetKey}?`
                      : `Do you want to rematch all decisions?`
                  }
                  onConfirm={() =>
                    this.rematchDecisions(params.subjectDatasetKey)
                  }
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    loading={rematchDecisionsLoading}
                    style={{ marginLeft: "10px", marginBottom: "10px" }}
                  >
                    Rematch all decisions{" "}
                    {params.subjectDatasetKey
                      ? ` from dataset ${params.subjectDatasetKey}`
                      : ""}
                  </Button>
                </Popconfirm>

                {params.subjectDatasetKey && (
                  <Popconfirm
                    placement="rightTop"
                    title={`Do you want to delete all broken decisions from source dataset ${params.subjectDatasetKey}?`}
                    onConfirm={() =>
                      this.deleteBrokenDecisions(params.subjectDatasetKey)
                    }
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      loading={deleteBrokenDecisionsLoading}
                      style={{ marginLeft: "10px", marginBottom: "10px" }}
                    >
                      {`Delete all broken decisions from dataset ${params.subjectDatasetKey}`}
                    </Button>
                  </Popconfirm>
                )}
              </Col>
            )}
        </Row>
        {!error && (
          <Table
            size="small"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={pagination}
            rowKey="id"
            /*  expandedRowRender={(record) => (
                <pre>
                  {JSON.stringify(_.omit(record, ["dataset", "user"]), null, 4)}
                </pre>
              )} */
            expandedRowRender={
              !Auth.canEditDataset({ key: datasetKey }, user)
                ? null
                : (record) => (
                    <React.Fragment>
                      {record.mode === "update" && (
                        <a
                          onClick={() => {
                            this.setState({
                              rowsForEdit: [
                                {
                                  decisions: [
                                    _.omit(record, ["dataset", "user"]),
                                  ],
                                },
                              ],
                              decisionFormVisible: true,
                            });
                          }}
                        >
                          Edit <EditOutlined />
                        </a>
                      )}
                      <pre>
                        {JSON.stringify(
                          _.omit(record, ["dataset", "user"]),
                          null,
                          4
                        )}
                      </pre>
                    </React.Fragment>
                  )
            }
            onChange={this.handleTableChange}
          />
        )}
      </>
    );
  }
}

const mapContextToProps = ({ user, rank, decisionMode }) => ({
  user,
  rank,
  decisionMode,
});

export default withContext(mapContextToProps)(withRouter(CatalogueDecisions));
