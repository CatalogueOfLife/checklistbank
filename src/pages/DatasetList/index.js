import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { LockOutlined, UnlockOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Table,
  Alert,
  Row,
  Col,
  Form,
  Button,
  Tooltip,
  Tag,
  ConfigProvider,
  Empty,
  Popconfirm,
  notification,
} from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import moment from "moment";
import history from "../../history";
import Auth from "../../components/Auth";
import SearchBox from "./SearchBox";
import ColumnFilter from "./ColumnFilter2";
import DatasetLogo from "./DatasetLogo";
import ImportButton from "../../pages/Imports/importTabs/ImportButton";
import withContext from "../../components/hoc/withContext";
import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import Releases from "./Releases";
import DatasetNavLink from "./DatasetNavLink";
const FormItem = Form.Item;
const { isEditorOrAdmin, canEditDataset } = Auth;
const _ = require("lodash");

const PAGE_SIZE = 50;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  released: "green",
  failed: "red",
  waiting: "orange",
};

class DatasetList extends React.Component {
  constructor(props) {
    super(props);
    const { user } = this.props;

    this.state = {
      selectedRowKeys: [],
      selectedRows: [],
      data: [],
      excludeColumns:
        JSON.parse(localStorage.getItem("colplus_datasetlist_hide_columns")) ||
        [],
      columns: [],
      defaultColumns: [
        {
          title: "Key",
          dataIndex: "key",
          key: "key",
          render: (text, record) => (
            <DatasetNavLink text={text} record={record} />
          ),
          sorter: true,
        },
        {
          title: "Alias",
          dataIndex: "alias",
          key: "alias",
          render: (text, record) => (
            <DatasetNavLink text={text} record={record} />
          ),
          sorter: true,
        },
        {
          title: "Title",
          dataIndex: "title",
          key: "title",
          ellipsis: true,
          render: (text, record) => {
            return (
              <Tooltip title={text}>
                {" "}
                <DatasetNavLink text={text} record={record} />
              </Tooltip>
            );
          },
          sorter: true,
        },
        {
          title: "Version",
          dataIndex: "version",
          key: "version",
        },
        {
          title: "Logo",
          dataIndex: "key",
          key: "logo",
          render: (text, record) =>
            record.private ? null : (
              <DatasetLogo datasetKey={record.key} size="SMALL" />
            ),
        },
        {
          title: "Creator",
          dataIndex: "creator",
          key: "creator",
          sorter: true,
          ellipsis: {
            showTitle: false,
          },
          render: (text, record) => {
            return text && _.isArray(text) ? (
              <Tooltip
                placement="topLeft"
                title={text.map((t) => t.name).join(", ")}
              >
                {text.map((t) => t.name).join(", ")}
              </Tooltip>
            ) : (
              ""
            );
          },
        },
        {
          title: "Editor",
          dataIndex: "editor",
          key: "editor",
          sorter: true,
          ellipsis: {
            showTitle: false,
          },
          render: (text, record) => {
            return text && _.isArray(text) ? (
              <Tooltip
                placement="topLeft"
                title={text.map((t) => t.name).join(", ")}
              >
                {text.map((t) => t.name).join(", ")}
              </Tooltip>
            ) : (
              ""
            );
          },
        },
        {
          title: "Publisher",
          dataIndex: ["publisher", "name"],
          key: "publisher",
          sorter: true,
        },
        {
          title: "Contributor",
          dataIndex: "contributor",
          key: "contributor",
          sorter: true,
          ellipsis: {
            showTitle: false,
          },
          render: (text, record) => {
            return text && _.isArray(text) ? (
              <Tooltip
                placement="topLeft"
                title={text.map((t) => t.name).join(", ")}
              >
                {text.map((t) => t.name).join(", ")}
              </Tooltip>
            ) : (
              ""
            );
          },
        },
        {
          title: "Origin",
          dataIndex: "origin",
          key: "origin",
          sorter: true,
        },
        {
          title: "Contact",
          dataIndex: ["contact", "name"],
          key: "contact",
        },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          sorter: true,
        },
        {
          title: "License",
          dataIndex: "license",
          key: "license",
          sorter: true,
        },
        {
          title: "Geographic Scope",
          dataIndex: "geographicScope",
          key: "geographicScope",
          ellipsis: {
            showTitle: true,
          },
        },
        {
          title: "Confidence",
          dataIndex: "confidence",
          key: "confidence",
        },
        {
          title: "Completeness",
          dataIndex: "completeness",
          key: "completeness",
        },
        {
          title: "Size",
          dataIndex: "size",
          key: "size",
          sorter: true,
          render: (text) => {
            try {
              return Number(text).toLocaleString("en-GB");
            } catch (err) {
              console.log(err);
              return "";
            }
          },
        },
        {
          title: "Imported",
          dataIndex: "imported",
          key: "imported",
          sorter: true,
          render: (date) => {
            return date ? moment(date).format("MMM Do YYYY") : "";
          },
        },
        {
          title: "Last Import Attempt",
          dataIndex: "lastImportAttempt",
          key: "lastImportAttempt",
          sorter: true,
          render: (date) => {
            return moment(date).format("MMM Do YYYY");
          },
        },
        {
          title: "Import State",
          dataIndex: "lastImportState",
          key: "lastImportState",
          render: (text, record) => {
            return (
              <Tag color={tagColors[record?.lastImportState]}>
                {record?.lastImportState}
              </Tag>
            );
          },
        },

        {
          title: "Created",
          dataIndex: "created",
          key: "created",
          sorter: true,
          render: (date) => {
            return moment(date).format("MMM Do YYYY");
          },
        },
        {
          title: "Modified",
          dataIndex: "modified",
          key: "modified",
          sorter: true,
          render: (date) => {
            return moment(date).format("MMM Do YYYY");
          },
        },

        {
          title: "",
          dataIndex: "private",
          key: "private",
          width: 24,
          render: (text, record) => {
            return text === true ? (
              <LockOutlined style={{ color: "red" }} />
            ) : (
              <UnlockOutlined style={{ color: "green" }} />
            );
          },
        },
      ],
      search: _.get(this.props, "location.search.q") || "",
      params: {},
      pagination: {
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
      },

      loading: false,
    };
  }

  componentDidMount() {
    let params = qs.parse(_.get(this.props, "location.search"));
    if (!_.isEmpty(params)) {
      this.setState(
        {
          params,
          pagination: {
            pageSize: params.limit || PAGE_SIZE,
            current:
              Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) +
              1,
          },
        },
        this.getData
      );
    }
  }
  componentDidUpdate = (prevProps) => {
    const prevParams = qs.parse(_.get(prevProps, "location.search"));
    const params = qs.parse(_.get(this.props, "location.search"));
    if (params.releasedFrom !== prevParams.releasedFrom) {
      let params = qs.parse(_.get(this.props, "location.search"));
      if (!params.releasedFrom) {
        params.origin = ["project", "external"];
      }
      this.setState(
        {
          params,
          pagination: {
            pageSize: params.limit || PAGE_SIZE,
            current: 0 / Number(params.limit || PAGE_SIZE) + 1,
          },
        },
        this.getData
      );
    }
  };
  getData = () => {
    const {
      params,
      pagination: { pageSize: limit, current },
    } = this.state;

    this.setState({ loading: true });
    if (!params.q) {
      delete params.q;
    }
    if (!params.origin && !params.releasedFrom) {
      params.origin = ["external", "project"];
    }

    const newParamsWithPaging = {
      ...params,
      limit,
      offset: (current - 1) * limit,
    };
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify(newParamsWithPaging)}`,
    });
    axios(`${config.dataApi}dataset?${qs.stringify(newParamsWithPaging)}`)
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data.result,
          err: null,
          pagination: { ...this.state.pagination, total: res.data.total },
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    this.setState(
      {
        params: newParams,
        pagination: {
          pageSize: PAGE_SIZE,
          current: 1,
        },
      },
      this.getData
    );
  };
  onSelectReleasedFrom = (dataset) => {
    let params = qs.parse(_.get(this.props, "location.search"));
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify({ ...params, releasedFrom: dataset.key })}`,
    });

    // this.updateSearch({ releasedFrom: dataset.key });
  };
  onResetReleasedFrom = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify(_.omit(params, "releasedFrom"))}`,
    });
    // this.updateSearch({ releasedFrom: null });
  };

  handleTableChange = (pagination, filters, sorter) => {
    let params = qs.parse(_.get(this.props, "location.search"));

    let query = {
      ...params,
      ...Object.keys(filters).reduce(
        (acc, cur) => (filters[cur] !== null && (acc[cur] = filters[cur]), acc),
        {}
      ),
    };
    if (params.releasedFrom) {
      query.releasedFrom = params.releasedFrom;
      query.sortBy = "created";
      query.reverse = true;
    }
    if (params.q) {
      query.q = params.q;
    }
    if (sorter) {
      query.sortBy = sorter.field;
      if (sorter.order === "descend") {
        query.reverse = true;
      } else {
        query.reverse = false;
      }
    }

    this.setState({ params: query, pagination }, this.getData);
  };

  handleColumns = (excludeColumns) => {
    this.setState({ excludeColumns });
  };

  importDatasets = async (rows) => {
    const { addError } = this.props;
    for (const dataset of rows.filter((d) => d.origin === "external")) {
      try {
        await axios.post(`${config.dataApi}importer`, {
          datasetKey: dataset.key,
          priority: true,
          force: true,
        });
        notification.open({
          message: `Import started`,
          description: `Dataset: ${dataset?.alias || dataset.key}`,
        });
      } catch (error) {
        addError(error);
        notification.error({
          message: `Error`,
          description: `It was not possible to import ${
            dataset?.alias || dataset.key
          }`,
        });
      }
    }

    this.setState({ selectedRows: [], selectedRowKeys: [] });
  };

  deleteDatasets = async (rows) => {
    const { addError } = this.props;
    for (const dataset of rows) {
      try {
        await axios.delete(`${config.dataApi}dataset/${dataset.key}`);
        notification.open({
          message: `Deletion triggered`,
          description: `Dataset: ${dataset?.alias || dataset.key}`,
        });
      } catch (error) {
        addError(error);
        notification.error({
          message: `Error`,
          description: `It was not possible to delete ${
            dataset?.alias || dataset.key
          }`,
        });
      }
    }
    this.setState({ selectedRows: [], selectedRowKeys: [] });
  };

  getConfirmText = (action) => {
    const maxDatasets = 5;
    const { selectedRows } = this.state;
    return (
      <>
        Do you want to {action}
        <ul>
          {selectedRows.slice(0, maxDatasets).map((d) => (
            <li>{d?.alias || d.key}</li>
          ))}
        </ul>
        {selectedRows.length > maxDatasets && (
          <span>and {selectedRows.length - maxDatasets} more datasets? </span>
        )}
      </>
    );
  };

  render() {
    const {
      data,
      loading,
      error,
      excludeColumns,
      defaultColumns,
      params,
      pagination,
    } = this.state;
    const { datasetOrigin, recentDatasets, datasetType, user, importState } =
      this.props;
    defaultColumns[9].filters = datasetOrigin.map((i) => ({
      text: _.startCase(i),
      value: i,
    }));
    defaultColumns[11].filters = datasetType.map((i) => ({
      text: _.startCase(i),
      value: i,
    }));
    defaultColumns[19].filters = importState.map((i) => ({
      text: _.startCase(i?.name),
      value: i.name,
    }));
    if (params.origin) {
      defaultColumns[9].filteredValue = _.isArray(params.origin)
        ? params.origin
        : [params.origin];
    } else {
      defaultColumns[9].filteredValue = null;
    }
    defaultColumns[10].filters = datasetType.map((i) => ({
      text: _.startCase(i),
      value: i,
    }));
    if (params.type) {
      defaultColumns[11].filteredValue = _.isArray(params.type)
        ? params.type
        : [params.type];
    } else {
      defaultColumns[11].filteredValue = null;
    }
    if (params.lastImportState) {
      defaultColumns[19].filteredValue = _.isArray(params.lastImportState)
        ? params.lastImportState
        : [params.lastImportState];
    } else {
      defaultColumns[19].filteredValue = null;
    }

    const filteredColumns = isEditorOrAdmin(this.props.user)
      ? [
          ...defaultColumns,
          {
            title: "Action",
            dataIndex: "",
            width: 60,
            key: "__actions__",
            render: (text, record) =>
              record.origin === "external" &&
              canEditDataset(record, this.props.user) ? (
                <ImportButton
                  key={record.key}
                  record={{ datasetKey: record.key }}
                />
              ) : (
                ""
              ),
          },
        ]
      : defaultColumns;

    const columns = _.filter(
      filteredColumns,
      (v) => !_.includes(excludeColumns, v.key)
    );

    let queryparams = qs.parse(_.get(this.props, "location.search"));
    const noParams = _.isEmpty(queryparams);

    return (
      <Layout
        openKeys={["dataset"]}
        selectedKeys={["/dataset"]}
        title="Datasets"
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
            <Row>
              <Col xs={24} sm={24} md={12} lg={12}>
                <SearchBox
                  defaultValue={_.get(this.state, "params.q")}
                  style={{ marginBottom: "10px", width: "50%" }}
                  onSearch={(value) => this.updateSearch({ q: value })}
                />
                <FormItem>
                  <div style={{ marginTop: "10px" }}>
                    <DatasetAutocomplete
                      defaultDatasetKey={_.get(params, "releasedFrom") || null}
                      onResetSearch={this.onResetReleasedFrom}
                      onSelectDataset={this.onSelectReleasedFrom}
                      placeHolder="Released from"
                      origin="project"
                      autoFocus={false}
                    />
                  </div>
                </FormItem>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12}>
                <FormItem
                  style={{ width: "100%" }}
                  {...formItemLayout}
                  label="Show columns"
                >
                  <ColumnFilter
                    columns={defaultColumns}
                    onChange={this.handleColumns}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col>
                {" "}
                <NavLink
                  to={{
                    pathname: `/dataset`,
                    search: `?releasedFrom=3&sortBy=created`,
                  }}
                  exact={true}
                >
                  <Button
                    style={{
                      marginTop: "10px",
                      marginBottom: "10px",
                      marginRight: "10px",
                    }}
                    type="primary"
                  >
                    COL Releases
                  </Button>
                </NavLink>{" "}
              </Col>
              {user && (
                <Col>
                  {" "}
                  <NavLink to={{ pathname: `/newdataset` }} exact={true}>
                    <Button
                      style={{
                        marginTop: "10px",
                        marginBottom: "10px",
                        marginRight: "10px",
                      }}
                      type="primary"
                    >
                      <PlusOutlined />
                      New Dataset
                    </Button>
                  </NavLink>{" "}
                </Col>
              )}
              {!noParams && (
                <Col>
                  <Button
                    type="danger"
                    style={{
                      marginTop: "10px",
                      marginBottom: "10px",
                      marginRight: "10px",
                    }}
                    onClick={() => {
                      history.push({
                        pathname: "/dataset",
                      });

                      this.setState({
                        params: {},
                        data: [],
                        pagination: {
                          pageSize: PAGE_SIZE,
                          current: 1,
                        },
                      });
                    }}
                  >
                    Reset search
                  </Button>
                </Col>
              )}
              <Col flex="auto"></Col>
              {recentDatasets && recentDatasets.length > 0 && (
                <Col>
                  Recently visited:{" "}
                  <div>
                    {recentDatasets.map((d) => (
                      <DatasetNavLink
                        key={d.key}
                        record={d}
                        text={
                          <Tag size="small">{d.alias ? d.alias : d.key}</Tag>
                        }
                      />
                      /*  <NavLink
                       to={{
                         pathname: (d.origin === 'project' && Auth.canViewDataset(d, user)) ? `/catalogue/${d.key}/metadata` : `/dataset/${d.key}`,
                       }}
                     >
                       <Tag size="small">{d.alias ? d.alias : d.key}</Tag>
                     </NavLink> */
                    ))}
                  </div>
                </Col>
              )}
            </Row>
            <Row>
              <Col flex="auto"></Col>
              <Col>
                {pagination &&
                  !isNaN(pagination.total) &&
                  `${(
                    (pagination.current - 1) * pagination.pageSize +
                    1
                  ).toLocaleString("en-GB")} - ${(
                    pagination.current * pagination.pageSize
                  ).toLocaleString(
                    "en-GB"
                  )} of ${pagination.total.toLocaleString("en-GB")}`}
              </Col>
            </Row>
            {error && <Alert message={error.message} type="error" />}
          </div>
          {!error && (
            <ConfigProvider
              renderEmpty={() =>
                noParams ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No search filters specified"
                  >
                    <Button
                      type="primary"
                      onClick={() => {
                        let params = {
                          limit: PAGE_SIZE,
                          offset: 0,
                          origin: ["project", "external"],
                        };
                        history.push({
                          pathname: "/dataset",
                          search: `?limit=${PAGE_SIZE}&offset=0`,
                        });

                        this.setState(
                          {
                            params,
                            pagination: {
                              pageSize: params.limit || PAGE_SIZE,
                              current:
                                Number(params.offset || 0) /
                                  Number(params.limit || PAGE_SIZE) +
                                1,
                            },
                          },
                          this.getData
                        );
                      }}
                    >
                      Show all datasets
                    </Button>
                  </Empty>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
              }
            >
              <Table
                size="middle"
                columns={columns}
                dataSource={data}
                loading={loading}
                scroll={{ x: `${columns.length * 120}px` }}
                pagination={pagination}
                onChange={this.handleTableChange}
                expandable={{
                  expandedRowRender: (record) => <Releases dataset={record} />,
                  rowExpandable: (record) => record.origin === "project",
                }}
                rowSelection={
                  !Auth.isAuthorised(user, ["admin"])
                    ? null
                    : {
                        selectedRowKeys: this.state.selectedRowKeys,
                        onChange: (selectedRowKeys, selectedRows) => {
                          this.setState({ selectedRowKeys, selectedRows });
                          // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                        },
                        selections: [
                          {
                            key: "import",
                            text: (
                              <Popconfirm
                                placement="topLeft"
                                title={this.getConfirmText("import")}
                                onConfirm={() =>
                                  this.importDatasets(this.state.selectedRows)
                                }
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button
                                  onClick={(e) => e.stopPropagation()}
                                  type="primary"
                                >
                                  Import {this.state.selectedRowKeys.length}{" "}
                                  datasets
                                </Button>
                              </Popconfirm>
                            ),
                          },
                          {
                            key: "delete",
                            text: (
                              <Popconfirm
                                placement="topLeft"
                                title={this.getConfirmText("delete")}
                                onConfirm={() =>
                                  this.deleteDatasets(this.state.selectedRows)
                                }
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button
                                  onClick={(e) => e.stopPropagation()}
                                  type="danger"
                                >
                                  Delete {this.state.selectedRowKeys.length}{" "}
                                  datasets
                                </Button>
                              </Popconfirm>
                            ),
                          },
                        ],
                      }
                }
              />
            </ConfigProvider>
          )}
        </div>
      </Layout>
    );
  }
}

const mapContextToProps = ({
  user,
  datasetType,
  datasetOrigin,
  catalogueKey,
  recentDatasets,
  importState,
  addError,
}) => ({
  user,
  datasetType,
  datasetOrigin,
  catalogueKey,
  recentDatasets,
  importState,
  addError,
});

export default withContext(mapContextToProps)(DatasetList);
