import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";
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
import moment from "dayjs";
import history from "../../history";
import Auth from "../../components/Auth";
import SearchBox from "./SearchBox";
import ColumnFilter from "./ColumnFilter2";
import DatasetLogo from "./DatasetLogo";
import ImportButton from "../../pages/Imports/importTabs/ImportButton";
import withContext from "../../components/hoc/withContext";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import DatasetDetails from "./DatasetDetails";
import DatasetNavLink from "./DatasetNavLink";
import TaxGroupIcon, { filterRedundantGroups, computeGroupDepths } from "../NameSearch/TaxGroupIcon";
const FormItem = Form.Item;
const { isEditorOrAdmin, canEditDataset } = Auth;
import _ from "lodash";

const PAGE_SIZE = 25;

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

const DatasetList = ({
  user,
  datasetType,
  datasetOrigin,
  license,
  projectKey,
  recentDatasets,
  importState,
  taxGroup,
  addError,
  location,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [data, setData] = useState([]);
  const [excludeColumns, setExcludeColumns] = useState(
    JSON.parse(localStorage.getItem("colplus_datasetlist_hide_columns")) ||
      ["key", "doi", "version", "publisher", "origin", "group", "imported", "lastImportAttempt", "lastImportState", "created", "modified", "private"]
  );
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
    showQuickJumper: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track previous location.search for componentDidUpdate logic
  const [prevLocationSearch, setPrevLocationSearch] = useState(null);

  const getData = (currentParams, currentPagination) => {
    const { pageSize: limit, current } = currentPagination;

    setLoading(true);
    const queryParams = { ...currentParams };
    if (!queryParams.q) {
      delete queryParams.q;
    }
    if (!queryParams.origin && !queryParams.releasedFrom) {
      queryParams.origin = ["external", "project"];
    }

    const newParamsWithPaging = {
      ...queryParams,
      limit,
      offset: (current - 1) * limit,
      full: false,
    };
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify(newParamsWithPaging)}`,
    });
    axios(`${config.dataApi}dataset?${qs.stringify(newParamsWithPaging)}`)
      .then((res) => {
        setLoading(false);
        setData(res.data.result);
        setError(null);
        setPagination((prev) => ({ ...prev, total: res.data.total }));
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  // componentDidMount equivalent
  useEffect(() => {
    const initialParams = qs.parse(_.get({ location }, "location.search"));
    if (!_.isEmpty(initialParams)) {
      const newPagination = {
        pageSize: initialParams.limit || PAGE_SIZE,
        current:
          Number(initialParams.offset || 0) / Number(initialParams.limit || PAGE_SIZE) + 1,
        showQuickJumper: true,
      };
      setParams(initialParams);
      setPagination(newPagination);
      getData(initialParams, newPagination);
    }
    setPrevLocationSearch(location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate equivalent — watches releasedFrom changes in location.search
  useEffect(() => {
    if (prevLocationSearch === null) {
      // Skip initial mount (handled above)
      return;
    }
    const prevParams = qs.parse(prevLocationSearch || "");
    const currentParams = qs.parse(location.search || "");
    if (currentParams.releasedFrom !== prevParams.releasedFrom) {
      let newParams = { ...currentParams };
      if (!newParams.releasedFrom) {
        newParams.origin = ["project", "external"];
      }
      const newPagination = {
        pageSize: newParams.limit || PAGE_SIZE,
        current: 0 / Number(newParams.limit || PAGE_SIZE) + 1,
        showQuickJumper: true,
      };
      setParams(newParams);
      setPagination(newPagination);
      getData(newParams, newPagination);
    }
    setPrevLocationSearch(location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const updateSearch = (newSearchParams) => {
    let newParams = { ...params };
    _.forEach(newSearchParams, (v, k) => {
      newParams[k] = v;
    });
    Object.keys(newSearchParams).forEach((param) => {
      if (!newSearchParams[param]) {
        delete newParams[param];
      }
    });
    const newPagination = {
      pageSize: PAGE_SIZE,
      current: 1,
      showQuickJumper: true,
    };
    setParams(newParams);
    setPagination(newPagination);
    getData(newParams, newPagination);
  };

  const onSelectReleasedFrom = (dataset) => {
    let currentParams = qs.parse(_.get({ location }, "location.search"));
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify({ ...currentParams, releasedFrom: dataset.key })}`,
    });
  };

  const onResetReleasedFrom = () => {
    let currentParams = qs.parse(_.get({ location }, "location.search"));
    history.push({
      pathname: "/dataset",
      search: `?${qs.stringify(_.omit(currentParams, "releasedFrom"))}`,
    });
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    let currentParams = qs.parse(_.get({ location }, "location.search"));

    let query = { ...currentParams };
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null) {
        query[key] = filters[key];
      } else {
        delete query[key];
      }
    });
    if (currentParams.releasedFrom) {
      query.releasedFrom = currentParams.releasedFrom;
      query.sortBy = "created";
      query.reverse = true;
    }
    if (currentParams.q) {
      query.q = currentParams.q;
    }
    if (sorter) {
      query.sortBy = sorter.field;
      if (sorter.order === "descend") {
        query.reverse = true;
      } else {
        query.reverse = false;
      }
    }

    setParams(query);
    setPagination(newPagination);
    getData(query, newPagination);
  };

  const handleColumns = (cols) => {
    setExcludeColumns(cols);
  };

  const importDatasets = async (rows) => {
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
      } catch (err) {
        addError(err);
        notification.error({
          message: `Error`,
          description: `It was not possible to import ${dataset?.alias || dataset.key}`,
        });
      }
    }
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };

  const deleteDatasets = async (rows) => {
    for (const dataset of rows) {
      try {
        await axios.delete(`${config.dataApi}dataset/${dataset.key}`);
        notification.open({
          message: `Deletion triggered`,
          description: `Dataset: ${dataset?.alias || dataset.key}`,
        });
      } catch (err) {
        addError(err);
        notification.error({
          message: `Error`,
          description: `It was not possible to delete ${dataset?.alias || dataset.key}`,
        });
      }
    }
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };

  const getConfirmText = (action) => {
    const maxDatasets = 5;
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

  const defaultColumns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: 70,
      render: (text, record) => (
        <DatasetNavLink text={text} record={record} />
      ),
      sorter: true,
    },
    {
      title: "DOI",
      dataIndex: "doi",
      key: "doi",
      width: 140,
      render: (doi) =>
        doi ? (
          <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">
            {doi}
          </a>
        ) : null,
    },
    {
      title: "Alias",
      dataIndex: "alias",
      key: "alias",
      width: 160,
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
      onCell: () => ({ style: { minWidth: 250 } }),
      onHeaderCell: () => ({ style: { minWidth: 250 } }),
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
      width: 140,
    },
    {
      title: "Logo",
      dataIndex: "key",
      key: "logo",
      width: 100,
      render: (text, record) =>
        record.private ? null : (
          <DatasetLogo datasetKey={record.key} size="SMALL" maxWidth={80} />
        ),
    },
    {
      title: "Publisher",
      dataIndex: ["publisher", "name"],
      key: "publisher",
      width: 200,
      sorter: true,
    },
    {
      title: "Origin",
      dataIndex: "origin",
      key: "origin",
      width: 90,
      sorter: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      sorter: true,
    },
    {
      title: "Group Coverage",
      dataIndex: "taxonomicGroupScope",
      key: "group",
      width: 180,
      render: (groups) => {
        const filtered = filterRedundantGroups(groups, taxGroup);
        if (!filtered || filtered.length === 0) return null;
        const MAX = 8;
        const visible = filtered.slice(0, MAX);
        const hidden = filtered.length - MAX;
        return (
          <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            {visible.map((g) => (
              <TaxGroupIcon key={g} group={g} size={18} />
            ))}
            {hidden > 0 && (
              <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>+{hidden} more</span>
            )}
          </span>
        );
      },
    },
    {
      title: "License",
      dataIndex: "license",
      key: "license",
      width: 80,
      sorter: true,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 90,
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
      width: 130,
      sorter: true,
      render: (date) => {
        return date ? moment(date).format("MMM Do YYYY") : "";
      },
    },
    {
      title: "Last Import Attempt",
      dataIndex: "lastImportAttempt",
      key: "lastImportAttempt",
      width: 130,
      sorter: true,
      render: (date) => {
        return moment(date).format("MMM Do YYYY");
      },
    },
    {
      title: "Import State",
      dataIndex: "lastImportState",
      key: "lastImportState",
      width: 120,
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
      width: 130,
      sorter: true,
      render: (date) => {
        return moment(date).format("MMM Do YYYY");
      },
    },
    {
      title: "Modified",
      dataIndex: "modified",
      key: "modified",
      width: 130,
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
      render: (text) => {
        return text === true ? (
          <LockOutlined style={{ color: "red" }} />
        ) : (
          <UnlockOutlined style={{ color: "green" }} />
        );
      },
    },
  ];

  // Apply column filters (mutating copies is fine here — new array each render)
  defaultColumns[7].filters = datasetOrigin
    ? datasetOrigin.map((i) => ({ text: _.startCase(i), value: i }))
    : [];
  if (params.origin) {
    defaultColumns[7].filteredValue = _.isArray(params.origin) ? params.origin : [params.origin];
  } else {
    defaultColumns[7].filteredValue = null;
  }

  defaultColumns[8].filters = datasetType
    ? datasetType.map((i) => ({ text: _.startCase(i), value: i }))
    : [];
  if (params.type) {
    defaultColumns[8].filteredValue = _.isArray(params.type) ? params.type : [params.type];
  } else {
    defaultColumns[8].filteredValue = null;
  }

  defaultColumns[10].filters = license
    ? license.map((i) => ({ text: _.startCase(i), value: i }))
    : [];
  if (params.license) {
    defaultColumns[10].filteredValue = _.isArray(params.license) ? params.license : [params.license];
  } else {
    defaultColumns[10].filteredValue = null;
  }

  defaultColumns[14].filters = importState
    ? importState.map((i) => ({ text: _.startCase(i?.name), value: i.name }))
    : [];
  if (params.lastImportState) {
    defaultColumns[14].filteredValue = _.isArray(params.lastImportState)
      ? params.lastImportState
      : [params.lastImportState];
  } else {
    defaultColumns[14].filteredValue = null;
  }

  const groupDepths = computeGroupDepths(taxGroup);
  defaultColumns[9].filters = taxGroup
    ? Object.values(taxGroup).map((g) => ({
        text: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingLeft: (groupDepths[g.name] || 0) * 16 }}>
            {g.icon && (
              <img src={g.icon} alt={g.name} style={{ width: 16, height: 16 }} />
            )}
            {g.name}
          </span>
        ),
        value: g.name,
      }))
    : [];
  if (params.group) {
    defaultColumns[9].filteredValue = _.isArray(params.group) ? params.group : [params.group];
  } else {
    defaultColumns[9].filteredValue = null;
  }

  const filteredColumns = isEditorOrAdmin(user)
    ? [
        ...defaultColumns,
        {
          title: "Action",
          dataIndex: "",
          width: 90,
          key: "__actions__",
          render: (text, record) =>
            record.origin === "external" && canEditDataset(record, user) ? (
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

  let queryparams = qs.parse(_.get({ location }, "location.search"));
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
                defaultValue={_.get(params, "q")}
                style={{ marginBottom: "10px", width: "50%" }}
                onSearch={(value) => updateSearch({ q: value })}
              />
              <FormItem>
                <div style={{ marginTop: "10px" }}>
                  <DatasetAutocomplete
                    defaultDatasetKey={_.get(params, "releasedFrom") || null}
                    onResetSearch={onResetReleasedFrom}
                    onSelectDataset={onSelectReleasedFrom}
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
                  onChange={handleColumns}
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
                end
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
                <NavLink to={{ pathname: `/newdataset` }} end>
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
                  danger
                  style={{
                    marginTop: "10px",
                    marginBottom: "10px",
                    marginRight: "10px",
                  }}
                  onClick={() => {
                    history.push({
                      pathname: "/dataset",
                    });
                    setParams({});
                    setData([]);
                    setPagination({
                      pageSize: PAGE_SIZE,
                      current: 1,
                      showQuickJumper: true,
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
                  (pagination.current - 1) * pagination.pageSize + 1
                ).toLocaleString("en-GB")} - ${(
                  pagination.current * pagination.pageSize
                ).toLocaleString(
                  "en-GB"
                )} of ${pagination.total.toLocaleString("en-GB")}`}
            </Col>
          </Row>
          {error && <Alert title={error.message} type="error" />}
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
                      const newParams = {
                        limit: PAGE_SIZE,
                        offset: 0,
                        origin: ["project", "external"],
                      };
                      const newPagination = {
                        pageSize: newParams.limit || PAGE_SIZE,
                        current:
                          Number(newParams.offset || 0) /
                            Number(newParams.limit || PAGE_SIZE) +
                          1,
                        showQuickJumper: true,
                      };
                      history.push({
                        pathname: "/dataset",
                        search: `?limit=${PAGE_SIZE}&offset=0`,
                      });
                      setParams(newParams);
                      setPagination(newPagination);
                      getData(newParams, newPagination);
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
              pagination={pagination}
              onChange={handleTableChange}
              expandable={{
                expandedRowRender: (record) => <DatasetDetails record={record} />,
                columnWidth: 32,
              }}
              rowSelection={
                !Auth.isAuthorised(user, ["admin"])
                  ? null
                  : {
                      selectedRowKeys,
                      onChange: (keys, rows) => {
                        setSelectedRowKeys(keys);
                        setSelectedRows(rows);
                      },
                      selections: [
                        {
                          key: "import",
                          text: (
                            <Popconfirm
                              placement="topLeft"
                              title={getConfirmText("import")}
                              onConfirm={() => importDatasets(selectedRows)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                type="primary"
                              >
                                Import {selectedRowKeys.length}{" "}
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
                              title={getConfirmText("delete")}
                              onConfirm={() => deleteDatasets(selectedRows)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                danger
                              >
                                Delete {selectedRowKeys.length}{" "}
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
};

const mapContextToProps = ({
  user,
  datasetType,
  datasetOrigin,
  license,
  projectKey,
  recentDatasets,
  importState,
  taxGroup,
  addError,
}) => ({
  user,
  datasetType,
  datasetOrigin,
  license,
  projectKey,
  recentDatasets,
  importState,
  taxGroup,
  addError,
});

export default withRouter(withContext(mapContextToProps)(DatasetList));
