import { useEffect, useRef, useState } from "react";
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
  App,
} from "antd";
import withRouter from "../../../withRouter";
import config from "../../../config";
import moment from "dayjs";
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
import RematchResult from "../ProjectSectors/RematchResult";
import DecisionForm from "../../WorkBench/DecisionForm";
const FormItem = Form.Item;
const { Search } = Input;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

const PAGE_SIZE = 100;

const ProjectDecisions = ({
  location,
  datasetKey,
  user,
  rank,
  decisionMode,
  type,
  releasedFrom,
}) => {
  const { notification } = App.useApp();
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rematchDecisionsLoading, setRematchDecisionsLoading] = useState(false);
  const [deleteBrokenDecisionsLoading, setDeleteBrokenDecisionsLoading] = useState(false);
  const [rematchInfo, setRematchInfo] = useState(null);
  const [error, setError] = useState(null);
  const [facetMode, setFacetMode] = useState(null);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
    showQuickJumper: true,
    total: 0,
    showTotal: (total) => `Total ${total} items`,
  });
  const [decisionFormVisible, setDecisionFormVisible] = useState(false);
  const [rowsForEdit, setRowsForEdit] = useState([]);

  const nameRef = useRef(null);

  const decorateWithDataset = (res) => {
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
          .then((u) => (decision.user = u))
      ),
    ]).then(() => res);
  };

  const getData = () => {
    setLoading(true);
    const params = {
      ...qs.parse(_.get(location, "search")),
      facet: "mode",
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
      .then(decorateWithDataset)
      .then((res) => {
        setLoading(false);
        setError(null);
        setData(_.get(res, "data.result") || []);
        setFacetMode(
          (res?.data?.facets?.mode || []).reduce((acc, cur) => {
            acc[cur.value] = cur.count;
            return acc;
          }, {})
        );
        setPagination((prev) => ({
          ...prev,
          total: _.get(res, "data.total"),
        }));
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    let params = qs.parse(_.get(location, "search"));
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: _.get(location, "pathname"),
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }
    setPagination((prev) => ({
      ...prev,
      pageSize: params.limit || PAGE_SIZE,
      current:
        Number(params.offset) / Number(params.limit || PAGE_SIZE) + 1,
    }));
    // getData called by the location.search effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = qs.parse(_.get(location, "search"));
    setPagination((prev) => ({
      ...prev,
      pageSize: params.limit || PAGE_SIZE,
      current:
        Number(params.offset) / Number(params.limit || PAGE_SIZE) + 1,
    }));
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, datasetKey]);

  const handleTableChange = (newPagination) => {
    const params = {
      ...qs.parse(_.get(location, "search")),
      limit: newPagination.pageSize,
      offset: (newPagination.current - 1) * newPagination.pageSize,
    };

    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(params),
    });
  };

  const updateSearch = (params) => {
    let newParams = {
      ...qs.parse(_.get(location, "search")),
      ...params,
      offset: 0,
    };
    Object.keys(params).forEach((param) => {
      if (!params[param]) {
        delete newParams[param];
      }
    });
    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(newParams),
    });
  };

  const onSelectDataset = (dataset) => {
    updateSearch({ subjectDatasetKey: dataset.key });
  };

  const onResetDataset = () => {
    let newParams = qs.parse(_.get(location, "search"));
    delete newParams.subjectDatasetKey;
    history.push({
      pathname: _.get(location, "pathname"),
      search: qs.stringify(newParams),
    });
  };

  const resetAllFilters = () => {
    if (nameRef?.current?.input?.state?.value) {
      nameRef.current.input.state.value = "";
    }

    history.push({
      pathname: _.get(location, "pathname"),
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
  };

  const rematchDecisions = (subjectDatasetKey) => {
    setRematchDecisionsLoading(true);
    const body = subjectDatasetKey ? { subjectDatasetKey } : {};
    axios
      .post(`${config.dataApi}dataset/${datasetKey}/decision/rematch`, body)
      .then((res) => {
        setRematchDecisionsLoading(false);
        setError(null);
        setRematchInfo({ decisions: res.data });
      })
      .catch((err) => {
        setError(err);
        setRematchInfo(null);
        setRematchDecisionsLoading(false);
      });
  };

  const deleteBrokenDecisions = (subjectDatasetKey) => {
    setDeleteBrokenDecisionsLoading(true);
    axios
      .delete(
        `${config.dataApi}dataset/${datasetKey}/decision?datasetKey=${subjectDatasetKey}&broken=true`
      )
      .then((res) => {
        notification.success({
          message: "Success",
          description: `Deleted ${res} broken decisions`,
        });
        setDeleteBrokenDecisionsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setDeleteBrokenDecisionsLoading(false);
      });
  };

  const params = qs.parse(_.get(location, "search"));

  const columns = [
    {
      title: "Dataset",
      dataIndex: ["dataset", "title"],
      key: "title",
      render: (text, record) => {
        return (
          <NavLink
            to={{
              pathname: `/project/${
                type === "project" ? datasetKey : releasedFrom
              }/dataset/${record.subjectDatasetKey}/imports`,
            }}
            end
          >
            <Highlighter
              highlightStyle={{ fontWeight: "bold", padding: 0 }}
              searchWords={[searchText]}
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
          <>
            <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
              {record?.subject?.rank}:{" "}
            </div>
            {!record?.subject?.id && (
              <NavLink
                to={{
                  pathname: `/dataset/${record.subjectDatasetKey}/names`,
                  search: `?q=${record?.subject?.name}`,
                }}
                end
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
                  pathname: `/project/${
                    type === "project" ? datasetKey : releasedFrom
                  }/dataset/${record.subjectDatasetKey}/taxon/${
                    record?.subject?.id
                  }`,
                }}
                end
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
          </>
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
    type === "project"
  ) {
    columns.push({
      title: "Action",
      key: "action",
      width: 250,
      render: (text, record) => (
        <>
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
              danger
              onClick={() => {
                return axios
                  .delete(
                    `${config.dataApi}dataset/${datasetKey}/decision/${record.id}`
                  )
                  .then(() => {
                    setData((prev) => prev.filter((d) => d.id !== record.id));
                    notification.open({
                      message: "Decision deleted",
                    });
                  });
              }}
            >
              <DeleteOutlined />
            </Button>
          }
        </>
      ),
    });
  }

  return (
    <>
      {error && (
        <Alert
          closable={{ onClose: () => setError(null) }}
          title={error.message}
          type="error"
        />
      )}
      {rematchInfo && (
        <Alert
          closable={{ onClose: () => setRematchInfo(null) }}
          title="Rematch succeded"
          description={<RematchResult rematchInfo={rematchInfo} />}
          type="success"
          style={{ marginBottom: "10px" }}
        />
      )}
      {decisionFormVisible && (
        <DecisionForm
          rowsForEdit={rowsForEdit}
          onCancel={() => {
            setDecisionFormVisible(false);
            setRowsForEdit([]);
          }}
          onOk={() => {
            setDecisionFormVisible(false);
            setRowsForEdit([]);
          }}
          onSaveDecision={() => {
            setDecisionFormVisible(false);
            setRowsForEdit([]);
            getData();
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
              onResetSearch={onResetDataset}
              onSelectDataset={onSelectDataset}
              contributesTo={datasetKey}
              placeHolder="Source dataset"
            />
          </div>
        </FormItem>
        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <Search
            placeholder="Taxon name"
            defaultValue={params.name}
            onSearch={(value) => updateSearch({ name: value })}
            style={{ width: 200 }}
            ref={nameRef}
            allowClear
          />
        </FormItem>
        <FormItem
          label="Stale"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            checked={params.stale === true || params.stale === "true"}
            onChange={(value) => updateSearch({ stale: value })}
          />
        </FormItem>
        <FormItem
          label="Only broken"
          style={{ marginBottom: "8px", marginRight: "8px" }}
        >
          <Switch
            disabled={params.stale === true || params.stale === "true"}
            checked={params.broken === true || params.broken === "true"}
            onChange={(value) => updateSearch({ broken: value })}
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
                updateSearch({ modifiedBy: value ? user.key : null })
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
            onChange={(value) => updateSearch({ rank: value })}
            options={rank.map((r) => ({ value: r, label: r }))}
          />
        </FormItem>
        <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
          <Select
            disabled={params.stale === true || params.stale === "true"}
            placeholder="Decision mode"
            style={{ width: 160 }}
            value={params.mode}
            showSearch
            allowClear
            onChange={(value) => updateSearch({ mode: value })}
            options={decisionMode.map((r) => ({
              value: r.name,
              label: `${r.name}${facetMode?.[r.name] > 0 ? ` (${facetMode[r.name].toLocaleString("en-GB")})` : ""}`,
            }))}
          />
        </FormItem>
      </Form>
      <Row>
        <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
          <Button danger onClick={resetAllFilters}>
            Reset all
          </Button>
        </Col>
        <Col flex="auto"></Col>
        {Auth.canEditDataset({ key: datasetKey }, user) &&
          type === "project" && (
            <Col style={{ textAlign: "right" }}>
              <Popconfirm
                placement="rightTop"
                title={
                  params.subjectDatasetKey
                    ? `Do you want to rematch all decisions from source dataset ${params.subjectDatasetKey}?`
                    : `Do you want to rematch all decisions?`
                }
                onConfirm={() =>
                  rematchDecisions(params.subjectDatasetKey)
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
                    deleteBrokenDecisions(params.subjectDatasetKey)
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
        <>
          <Row>
            <Col flex="auto" />
            <Col>
              {pagination?.total?.toLocaleString("en-GB")}{" "}
              Decisions
            </Col>
          </Row>
          <Table
            size="small"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={pagination}
            rowKey="id"
            expandedRowRender={(record) => (
              <>
                {record.mode === "update" &&
                  Auth.canEditDataset({ key: datasetKey }, user) && (
                    <a
                      onClick={() => {
                        setRowsForEdit([
                          {
                            decisions: [
                              _.omit(record, ["dataset", "user"]),
                            ],
                          },
                        ]);
                        setDecisionFormVisible(true);
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
              </>
            )}
            onChange={handleTableChange}
          />
        </>
      )}
    </>
  );
};

const mapContextToProps = ({ user, rank, decisionMode }) => ({
  user,
  rank,
  decisionMode,
});

export default withContext(mapContextToProps)(withRouter(ProjectDecisions));
