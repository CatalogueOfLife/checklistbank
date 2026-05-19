import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  EditOutlined,
  LinkOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Table,
  Alert,
  Row,
  Col,
  Button,
  Select,
  Radio,
  App,
  Switch,
  Form,
} from "antd";
import Tabs from "../../components/Tabs";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "../NameSearch/Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "../NameSearch/MultiValueFilter";
import DecisionTag from "./DecisionTag";
import CopyableColumnText from "./CopyableColumnText";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import ErrorMsg from "../../components/ErrorMsg";
import DecisionForm from "./DecisionForm";
import Auth from "../../components/Auth";
import NameAutocomplete from "../project/Assembly/NameAutocomplete";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";
import RegExSearch from "./RegExSearch";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const FACETS = [
  "rank",
  "issue",
  "status",
  "nomStatus",
  "nameType",
  "field",
  "authorship",
  "authorshipYear",
  "extinct",
  "environment",
  "origin",
  /*   "sectorMode",
   */
];
const PAGE_SIZE = 50;
const getDecisionText = (decision) => {
  if (!_.get(decision, "mode")) {
    return "";
  } else if (
    ["block", "ignore", "reviewed"].includes(_.get(decision, "mode"))
  ) {
    return _.get(decision, "mode");
  } else if (_.get(decision, "status")) {
    return _.get(decision, "status");
  } else {
    return "update";
  }
};

const getColumns = (projectKey, user) => [
  {
    title: "Decision",
    dataIndex: "decisions",
    key: "decisions",
    width: 60,
    className: "workbench-td",
    render: (text, record) =>
      !Auth.canEditDataset({ key: projectKey }, user) ? (
        getDecisionText(_.get(record, "decisions[0]"))
      ) : (
        <DecisionTag
          decision={_.get(record, "decisions[0]")}
          projectKey={projectKey}
        />
      ),
  },
  {
    title: "ID",
    dataIndex: ["usage", "id"],
    key: "nameId",
    width: 50,
    className: "workbench-td",
    render: (text, record) => {
      const uri =
        !_.get(record, "usage.id") ||
        record.usage.bareName ||
        !_.get(record, "usage.status")
          ? `/project/${projectKey}/dataset/${_.get(
              record,
              "usage.name.datasetKey"
            )}/name/${encodeURIComponent(_.get(record, "usage.name.id"))}`
          : `/project/${projectKey}/dataset/${_.get(
              record,
              "usage.name.datasetKey"
            )}/taxon/${encodeURIComponent(
              _.get(record, "usage.accepted.id")
                ? _.get(record, "usage.accepted.id")
                : _.get(record, "usage.id")
            )}`;
      return (
        <React.Fragment>
          <div style={{ float: "left" }}>
            <CopyableColumnText text={text} width="40px" />
          </div>
          <div>
            <NavLink
              key={_.get(record, "usage.id")}
              to={{
                pathname: uri,
              }}
              end
            >
              <LinkOutlined />
            </NavLink>
          </div>
        </React.Fragment>
      );
    },
  },
  {
    title: "Status",
    dataIndex: ["usage", "status"],
    key: "status",
    width: 90,
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="60px" />,
  },
  {
    title: "ScientificName",
    dataIndex: ["usage", "labelHtml"],
    width: 240,
    className: "workbench-td",
    render: (text, record) => (
      <span
        dangerouslySetInnerHTML={{
          __html: _.get(record, "usage.labelHtml"),
        }}
      />
    ),
    sorter: true,
  },
  {
    title: "Uninomial",
    width: 160,
    dataIndex: ["usage", "name", "uninomial"],
    key: "uninomial",
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="150px" />,
  },
  {
    title: "Genus",
    width: 160,
    dataIndex: ["usage", "name", "genus"],
    key: "genus",
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="150px" />,
  },
  {
    title: "specificEpithet",
    width: 160,
    dataIndex: ["usage", "name", "specificEpithet"],
    key: "specificEpithet",
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="150px" />,
  },
  {
    title: "infraspecificEpithet",
    width: 160,
    dataIndex: ["usage", "name", "infraspecificEpithet"],
    key: "infraspecificEpithet",
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="150px" />,
  },
  {
    title: "Authorship",
    width: 240,
    dataIndex: ["usage", "name", "authorship"],
    key: "authorship",
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="230px" />,
  },

  {
    title: "Rank",
    width: 100,
    dataIndex: ["usage", "name", "rank"],
    key: "rank",
    sorter: true,
    className: "workbench-td",
    render: (text, record) => <CopyableColumnText text={text} width="90px" />,
  },
  {
    title: "acceptedScientificName",
    width: 240,
    dataIndex: ["usage", "accepted", "labelHtml"],
    className: "workbench-td",
    render: (text, record) => {
      return !["synonym", "ambiguous synonym", "misapplied"].includes(
        _.get(record, "usage.status")
      ) ? (
        ""
      ) : (
        <span
          dangerouslySetInnerHTML={{
            __html: _.get(record, "usage.accepted.labelHtml"),
          }}
        />
      );
    },
  },
  {
    title: "Classification",
    dataIndex: ["usage", "classification"],
    key: "classification",
    width: 400,
    className: "workbench-td",
    render: (text, record) => {
      return !_.get(record, "classification") ? (
        ""
      ) : (
        <Classification
          key={_.get(record, "usage.id")}
          baseUri={`/project/${projectKey}/dataset/${_.get(
            record,
            "usage.datasetKey"
          )}`}
          classification={_.initial(record.classification)}
          datasetKey={_.get(record, "usage.name.datasetKey")}
        />
      );
    },
  },
];

const WorkBench = ({
  datasetKey,
  projectKey,
  user,
  taxonomicstatus,
  rank,
  issue,
  nomstatus,
  nametype,
  namefield,
  addError,
  location,
}) => {
  const { notification } = App.useApp();
  const [activeTab, setActiveTab] = useState("1");
  const [data, setData] = useState({ result: [] });
  const [decision, setDecision] = useState(null);
  const [columns, setColumns] = useState(() => getColumns(projectKey, user));
  const [decisionFormVisible, setDecisionFormVisible] = useState(false);
  const [rowsForEdit, setRowsForEdit] = useState([]);
  const [params, setParams] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: 50,
    current: 1,
    showQuickJumper: true,
  });
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [error, setError] = useState(null);

  const getDecisions = (res) => {
    const cKey = Number(projectKey);
    const promises = _.get(res, "data.result")
      ? res.data.result.map((d) => {
          const myDecision = (d.decisions || []).find(
            (dec) => dec.datasetKey === cKey
          );
          if (!myDecision) {
            d.decisions = [];
            return Promise.resolve(false);
          }
          return axios(
            `${config.dataApi}dataset/${projectKey}/decision/${myDecision.id}`
          ).then((decision) => {
            if (decision.data) {
              d.decisions = [decision.data];
            }
          });
        })
      : [];
    return Promise.all(promises).then(() => res);
  };

  const getData = (currentParams, currentPagination) => {
    const { pageSize: limit, current } = currentPagination;

    setLoading(true);

    if (!currentParams.q) {
      delete currentParams.q;
    }
    const newParamsWithPaging = {
      ...currentParams,
      limit,
      offset: (current - 1) * limit,
    };
    history.push({
      pathname: `/project/${projectKey}/dataset/${datasetKey}/workbench`,
      search: `?${qs.stringify(newParamsWithPaging)}`,
    });
    let task = currentParams.USAGE_ID
      ? axios.post(`${config.dataApi}dataset/${datasetKey}/nameusage/search`, {
          facet: currentParams.facet,

          filter: {
            USAGE_ID: currentParams.USAGE_ID,
            catalogueKey: [projectKey],
            unsafe: [true],
          },
          page: {
            offset: Number((current - 1) * limit),
            limit: Number(limit),
          },
        })
      : axios(
          `${
            config.dataApi
          }dataset/${datasetKey}/nameusage/search?${qs.stringify({
            ...newParamsWithPaging,
            catalogueKey: projectKey,
          })}`
        );

    task
      .then((res) => getDecisions(res))
      .then((res) => {
        setLoading(false);
        setData(res.data);
        setError(null);
        setPagination((prev) => ({ ...prev, total: res.data.total }));
      })
      .catch((err) => {
        addError(err);
        setLoading(false);
        setData([]);
      });
  };

  // componentDidMount
  useEffect(() => {
    let initialParams = qs.parse(_.get({ location }, "location.search"));
    if (_.isEmpty(initialParams)) {
      initialParams = { limit: 50, offset: 0, facet: FACETS };
      history.push({
        pathname: `/project/${projectKey}/dataset/${datasetKey}/workbench`,
        search: `?limit=50&offset=0`,
      });
    } else if (!initialParams.facet) {
      initialParams.facet = FACETS;
    }
    initialParams.offset = initialParams.offset || 0;
    initialParams.limit = initialParams.limit || 50;

    const initialPagination = {
      pageSize: initialParams.limit || PAGE_SIZE,
      current:
        Number(initialParams.offset || 0) / Number(initialParams.limit || PAGE_SIZE) + 1,
      showQuickJumper: true,
      pageSizeOptions: [50, 100, 500, 1000],
    };
    setParams(initialParams);
    setPagination(initialPagination);
    getData(initialParams, initialPagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate: datasetKey / projectKey change
  useEffect(() => {
    const newParams = { limit: PAGE_SIZE, offset: 0, facet: FACETS };
    history.push({
      pathname: `/project/${projectKey}/dataset/${datasetKey}/workbench`,
      search: `?limit=50&offset=0`,
    });
    const newPagination = {
      pageSize: newParams.limit || PAGE_SIZE,
      current:
        Number(newParams.offset || 0) / Number(newParams.limit || PAGE_SIZE) + 1,
      showQuickJumper: true,
      pageSizeOptions: [50, 100, 500, 1000],
    };
    setParams(newParams);
    setPagination(newPagination);
    getData(newParams, newPagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, projectKey]);

  // componentDidUpdate: user change
  useEffect(() => {
    if (user) {
      setColumns(getColumns(projectKey, user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTableChange = (newPagination, filters, sorter) => {
    console.log(params);
    let query = {
      ...params,
      ..._.pickBy(filters),
    };

    if (sorter && sorter.field) {
      if (sorter.field[sorter.field.length - 1] === "labelHtml") {
        query.sortBy = "name";
      } else if (sorter.field[sorter.field.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = sorter.field[sorter.field.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }

    setParams(query);
    setFilteredInfo(filters);
    setPagination(newPagination);
    getData(query, newPagination);
  };

  const updateSearch = (newValues) => {
    let newParams = { ...params };
    _.forEach(newValues, (v, k) => {
      newParams[k] = v;
    });
    Object.keys(newValues).forEach((param) => {
      if (!newValues[param]) {
        delete newParams[param];
      }
    });
    if (newParams?.USAGE_ID) {
      newParams.unsafe = true;
    } else {
      delete newParams.unsafe;
    }
    const newPagination = { ...pagination, current: 1 };
    setParams(newParams);
    setPagination(newPagination);
    getData(newParams, newPagination);
  };

  const updateFilter = (query, filters, param) => {
    if (filters[param] && _.get(filters, `${param}.length`)) {
      query[param] = filters[param];
    } else if (!filters[param]) {
      delete query[param];
    }
    let catColumn = _.find(columns, (c) => {
      return c.key === param;
    });
    let filter =
      typeof query[param] === "string" ? [query[param]] : query[param];
    catColumn.filteredValue = filter;
  };

  const resetSearch = () => {
    history.push({
      pathname: `/project/${projectKey}/dataset/${datasetKey}/workbench`,
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
    const newParams = { facet: FACETS };
    const newPagination = {
      ...pagination,
      current: 1,
      pageSize: PAGE_SIZE,
    };
    setParams(newParams);
    setFilteredInfo(null);
    setPagination(newPagination);
    getData(newParams, newPagination);
  };

  const onSelectChange = (keys) => {
    setSelectedRowKeys(keys);
  };

  const onDecisionChange = (dec) => {
    setDecision(dec);
  };

  const cancelDecisionForm = () => {
    setDecisionFormVisible(false);
    setRowsForEdit([]);
  };

  const applyDecision = () => {
    const { result } = data;
    const promises = result
      .filter((d) => selectedRowKeys.includes(_.get(d, "usage.id")))
      .map((d) => {
        const mode = ["block", "ignore", "reviewed"].includes(decision)
          ? decision
          : "update";
        const parent = ["accepted", "provisionally accepted"].includes(
          d?.usage?.status
        )
          ? d.classification && d.classification.length > 1
            ? d.classification[d.classification.length - 2].name
            : ""
          : _.get(d, "usage.accepted.name.scientificName", "");
        let decisionObject = {
          subjectDatasetKey: datasetKey,
          subject: {
            id: _.get(d, "usage.id"),
            name: _.get(d, "usage.name.scientificName"),
            authorship: _.get(d, "usage.name.authorship"),
            rank: _.get(d, "usage.name.rank"),
            status: _.get(d, "usage.status"),
            parent: parent,
            code: _.get(d, "usage.name.code"),
          },
          mode: mode,
        };
        if (
          ["informal", "no name", "hybrid formula", "placeholder"].includes(
            decision
          )
        ) {
          decisionObject.name = { type: decision };
        }
        if (taxonomicstatus.includes(decision)) {
          decisionObject.status = decision;
        }

        return axios
          .post(
            `${config.dataApi}dataset/${projectKey}/decision`,
            decisionObject
          )

          .then((res) => {
            d.decisions = [{ id: res.data }];

            if (selectedRowKeys?.length < 6) {
              const statusMsg = `Status changed to ${decision} for ${_.get(
                d,
                "usage.name.scientificName"
              )}`;
              const decisionMsg = `${_.get(
                d,
                "usage.name.scientificName"
              )} was ${
                decision === "block" ? "blocked from the assembly" : ""
              }${
                decision === "ignore"
                  ? "ignored (Taxon blocked, but children kept under parent)"
                  : ""
              }${decision === "reviewed" ? "marked as reviewed" : ""}`;

              notification.open({
                message: "Decision applied",
                description: ["block", "ignore", "reviewed"].includes(decision)
                  ? decisionMsg
                  : statusMsg,
              });
            }
          });
      });

    return Promise.all(promises)
      .then((res) => {
        if (selectedRowKeys?.length > 5) {
          notification.open({
            message: "Success",
            description: `${selectedRowKeys?.length} decisions applied.`,
          });
        }
        return getDecisions({ data: { result: data.result } });
      })
      .then((res) => {
        setData((prev) => ({ ...prev }));
        setSelectedRowKeys([]);
        setDecisionFormVisible(false);
        setDecision(null);
      })
      .catch((err) => {
        addError(err);
        setData((prev) => ({ ...prev }));
        setSelectedRowKeys([]);
        setDecisionFormVisible(false);
        setDecision(null);
      });
  };

  const toggleAdvancedFilters = () => {
    setAdvancedFilters((prev) => !prev);
  };

  const { result, facets } = data;
  const facetRanks = _.get(facets, "rank")
    ? facets.rank.map((r) => ({
        value: r.value,
        label: `${_.startCase(r.value)} (${r.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetIssues = _.get(facets, "issue")
    ? facets.issue.map((i) => ({
        value: i.value,
        label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
      }))
    : [];
  /*    const facetSectorMode = _.get(facets, "sectorMode")
    ? facets.sectorMode.map((i) => ({
        value: i.value,
        label: `${_.startCase(i.value)} (${i.count.toLocaleString("en-GB")})`,
      }))
    : []; */
  const facetTaxonomicStatus = _.get(facets, "status")
    ? facets.status.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetNomStatus = _.get(facets, "nomStatus")
    ? facets["nomStatus"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : null;
  const facetNomType = _.get(facets, "nameType")
    ? facets.nameType.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetNomField = _.get(facets, "field")
    ? facets.field.map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetAuthorship = _.get(facets, "authorship")
    ? facets["authorship"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetAuthorshipYear = _.get(facets, "authorshipYear")
    ? facets["authorshipYear"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetExtinct = _.get(facets, "extinct")
    ? facets["extinct"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetEnvironment = _.get(facets, "environment")
    ? facets["environment"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];
  const facetOrigin = _.get(facets, "origin")
    ? facets["origin"].map((s) => ({
        value: s.value,
        label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
      }))
    : [];

  /*     columns[2].filters = facetTaxonomicStatus
    ? facetTaxonomicStatus.map((s) => ({ value: s.value, text: s.label }))
    : taxonomicstatus.map((s) => ({ value: s, text: _.startCase(s) }));
  columns[2].filteredValue = _.get(filteredInfo, "status") || null;
  columns[9].filters =
    facetRanks || rank.map((s) => ({ value: s, text: _.startCase(s) }));
  columns[9].filteredValue = _.get(filteredInfo, "rank") || null; */
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: "30px",
  };
  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        margin: "16px 0",
      }}
    >
      {decisionFormVisible && (
        <DecisionForm
          rowsForEdit={rowsForEdit}
          onCancel={cancelDecisionForm}
          onOk={() => {
            cancelDecisionForm();
            setSelectedRowKeys([]);
          }}
          onSaveDecision={(name) => {
            return getDecisions({ data: { result: [name] } }).then(
              (res) => {
                setData((prev) => ({ ...prev }));
              }
            );
          }}
          datasetKey={projectKey}
          subjectDatasetKey={datasetKey}
        />
      )}
      <Row>
        {error && (
          <Alert
            style={{ marginBottom: "10px" }}
            description={<ErrorMsg error={error} />}
            type="error"
          />
        )}
      </Row>
      <Tabs
        activeKey={activeTab}
        onChange={(activeKey) => setActiveTab(activeKey)}
        items={[
          {
            key: "1",
            label: "Search",
            children: (
              <Row style={{ marginBottom: "10px" }}>
                <Col span={14} style={{ display: "flex", flexFlow: "column" }}>
                  <SearchBox
                    defaultValue={_.get(params, "q")}
                    onSearch={(value) => updateSearch({ q: value })}
                    style={{ marginBottom: "10px", width: "100%" }}
                  />
                  <div style={{ marginTop: "10px" }}>
                    {" "}
                    <NameAutocomplete
                      datasetKey={datasetKey}
                      minRank="GENUS"
                      onSelectName={(value) => {
                        updateSearch({ TAXON_ID: value.key });
                      }}
                      onResetSearch={resetSearch}
                      placeHolder="Filter by higher taxon"
                      defaultTaxonKey={params.TAXON_ID || null}
                      autoFocus={false}
                    />{" "}
                  </div>
                  {projectKey === datasetKey && (
                    <div style={{ marginTop: "10px" }}>
                      <DatasetAutocomplete
                        contributesTo={Number(datasetKey)}
                        onSelectDataset={(value) => {
                          updateSearch({ SECTOR_DATASET_KEY: value.key });
                        }}
                        defaultDatasetKey={
                          _.get(params, "SECTOR_DATASET_KEY") || null
                        }
                        onResetSearch={(value) => {
                          updateSearch({ SECTOR_DATASET_KEY: null });
                        }}
                        placeHolder="Filter by source dataset"
                        autoFocus={false}
                      />
                    </div>
                  )}
                  <div style={{ marginTop: "10px" }}>
                    <Form layout="inline">
                      <FormItem label="Matching">
                        <RadioGroup
                          onChange={(evt) => {
                            updateSearch({ type: evt.target.value });
                          }}
                          value={params.type || "WHOLE_WORDS"}
                        >
                          <Radio value="EXACT">Exact</Radio>
                          <Radio value="WHOLE_WORDS">Words</Radio>
                          <Radio value="FUZZY">Fuzzy</Radio>
                          <Radio value="PREFIX">Prefix</Radio>
                        </RadioGroup>
                      </FormItem>

                      {/*                 <FormItem
                    style={{
                      marginBottom: "10px",
                    }}
                  >
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, ["status"]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({ status: evt.target.value });
                        }
                      }}
                      value={params.status}
                    >
                      <Radio value="_NULL">Exclude bare names</Radio>
                      <Radio value="_NOT_NULL">Only bare names</Radio>
                      <Radio value={undefined}>All</Radio>
                    </RadioGroup>
                  </FormItem> */}
                    </Form>
                  </div>
                </Col>
                <Col span={10}>
                  <MultiValueFilter
                    defaultValue={_.get(params, "issue")}
                    onChange={(value) => updateSearch({ issue: value })}
                    vocab={facetIssues}
                    label="Issues"
                  />
                  {/*                 <MultiValueFilter
                    defaultValue={_.get(params, "sectorMode")}
                    onChange={(value) => this.updateSearch({ sectorMode: value })}
                    vocab={facetSectorMode}
                    label="Sector Mode"
                  /> */}

                  <MultiValueFilter
                    defaultValue={_.get(params, "rank")}
                    onChange={(value) => updateSearch({ rank: value })}
                    vocab={facetRanks}
                    label="Ranks"
                  />
                  <MultiValueFilter
                    defaultValue={_.get(params, "status")}
                    onChange={(value) => updateSearch({ status: value })}
                    vocab={facetTaxonomicStatus}
                    label="Status"
                  />
                  {advancedFilters && (
                    <React.Fragment>
                      <MultiValueFilter
                        defaultValue={_.get(params, "nomStatus")}
                        onChange={(value) =>
                          updateSearch({ nomstatus: value })
                        }
                        vocab={facetNomStatus}
                        label="Nomenclatural status"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "nameType")}
                        onChange={(value) => updateSearch({ type: value })}
                        vocab={facetNomType}
                        label="Name type"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "field")}
                        onChange={(value) => updateSearch({ field: value })}
                        vocab={facetNomField}
                        label="Name field"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "authorship")}
                        onChange={(value) =>
                          updateSearch({ authorship: value })
                        }
                        vocab={facetAuthorship}
                        label="Authorship"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "authorshipYear")}
                        onChange={(value) =>
                          updateSearch({ authorshipYear: value })
                        }
                        vocab={facetAuthorshipYear}
                        label="Authorship Year"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "environment")}
                        onChange={(value) =>
                          updateSearch({ environment: value })
                        }
                        vocab={facetEnvironment}
                        label="Environment"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "extinct")}
                        onChange={(value) =>
                          updateSearch({ extinct: value })
                        }
                        vocab={facetExtinct}
                        label="Extinct"
                      />
                      <MultiValueFilter
                        defaultValue={_.get(params, "origin")}
                        onChange={(value) => updateSearch({ origin: value })}
                        vocab={facetOrigin}
                        label="Origin"
                      />
                    </React.Fragment>
                  )}
                  <div style={{ textAlign: "right", marginBottom: "8px" }}>
                    <a
                      style={{ marginLeft: 8, fontSize: 12 }}
                      onClick={toggleAdvancedFilters}
                    >
                      Advanced{" "}
                      {advancedFilters ? (
                        <UpOutlined />
                      ) : (
                        <DownOutlined />
                      )}
                    </a>
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: "2",
            label: "RegEx Search",
            children: (
              <RegExSearch
                decisionMode={_.get(params?.decisionMode)}
                limit={pagination.pageSize}
                style={{ marginBottom: "10px" }}
                datasetKey={datasetKey}
                updateSearch={updateSearch}
                onReset={() => updateSearch({ USAGE_ID: null })}
                onSearch={(val) => updateSearch({ USAGE_ID: val })}
                pagination={pagination}
              />
            ),
          },
        ]}
      />

      <Row>
        <Col span={14}>
          {" "}
          <Button
            danger
            onClick={resetSearch}
            style={{ width: "120px" }}
          >
            Reset search
          </Button>
        </Col>
        <Col span={10} style={{ textAlign: "right" }}>
          <FormItem
            style={{
              marginLeft: "10px",
              marginBottom: "10px",
            }}
          >
            <RadioGroup
              onChange={(evt) => {
                if (typeof evt.target.value === "undefined") {
                  const newParams = _.omit(params, ["decisionMode"]);
                  const newPagination = { ...pagination };
                  setParams(newParams);
                  getData(newParams, newPagination);
                } else {
                  updateSearch({ decisionMode: evt.target.value });
                }
              }}
              value={params.decisionMode}
            >
              <Radio value="_NOT_NULL" /* disabled={activeTab === "2"} */>
                With decision
              </Radio>
              <Radio value="_NULL" /* disabled={activeTab === "2"} */>
                Without decision
              </Radio>
              <Radio value={undefined}>All</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
      </Row>
      <Row>
        {Auth.canEditDataset({ key: projectKey }, user) && (
          <Col span={16} style={{ textAlign: "left", marginBottom: "8px" }}>
            <Select
              style={{ width: 200, marginRight: 10 }}
              onChange={onDecisionChange}
              allowClear
              showSearch
              options={[
                {
                  label: "General",
                  options: [
                    { value: "block", label: "Block" },
                    { value: "ignore", label: "Ignore" },
                    { value: "reviewed", label: "Reviewed" },
                  ],
                },
                {
                  label: "Status",
                  options: taxonomicstatus.map((s) => ({ value: s, label: _.startCase(s) })),
                },
                {
                  label: "Name type",
                  options: [
                    { value: "no name", label: "No name" },
                    { value: "placeholder", label: "Placeholder" },
                    { value: "hybrid formula", label: "Hybrid formula" },
                    { value: "informal", label: "Informal" },
                  ],
                },
                /* { label: "Nom. status", options: [{ value: "chresonym", label: "Chresonym" }] } */
              ]}
            />
            <Button
              type="primary"
              onClick={() => applyDecision()}
              disabled={!hasSelected || !decision}
              loading={loading}
              style={{ marginRight: 10 }}
            >
              Apply selected decision
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setDecisionFormVisible(true);
                setRowsForEdit(
                  result.filter((r) =>
                    selectedRowKeys.includes(_.get(r, "usage.id"))
                  )
                );
              }}
              disabled={!hasSelected}
              loading={loading}
            >
              Apply complex decisions
            </Button>
            <span style={{ marginLeft: 8 }}>
              {selectedRowKeys.length > 1 &&
                `Selected ${selectedRowKeys.length} ${
                  selectedRowKeys.length > 1 ? "taxa" : "taxon"
                }`}
            </span>
          </Col>
        )}
        <Col
          span={!Auth.canEditDataset({ key: projectKey }, user) ? 24 : 8}
          style={{ textAlign: "right", marginBottom: "8px" }}
        >
          {pagination &&
            !isNaN(pagination.total) &&
            `${(
              (pagination.current - 1) * pagination.pageSize +
              1
            ).toLocaleString("en-GB")} - ${(
              pagination.current * pagination.pageSize
            ).toLocaleString("en-GB")} of ${pagination.total.toLocaleString(
              "en-GB"
            )}`}
        </Col>
      </Row>
      {!error &&
        !loading &&
        _.get(pagination, "total") === 0 &&
        params.issue && (
          <Alert
            style={{ marginBottom: "10px" }}
            type="info"
            showIcon
            title="No matching results in the workbench"
            description={
              <span>
                The selected issue filter may only apply to source rows that
                are not indexed for name usage search. Try the{" "}
                <NavLink
                  to={{
                    pathname: `/project/${projectKey}/dataset/${datasetKey}/verbatim`,
                    search: `?${qs.stringify({ issue: params.issue })}`,
                  }}
                >
                  verbatim view
                </NavLink>{" "}
                instead.
              </span>
            }
          />
        )}
      {!error && (
        <Table
          scroll={{ x: 3000, y: 600 }}
          size="small"
          bordered
          columns={columns}
          dataSource={result}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey={(record) => _.get(record, "usage.id")}
          rowSelection={
            !Auth.canEditDataset({ key: projectKey }, user)
              ? null
              : rowSelection
          }
          expandable={{
            rowExpandable: () =>
              Auth.canEditDataset({ key: projectKey }, user),
            expandedRowRender: (record) =>
              _.get(record, "decisions[0]") ? (
                <React.Fragment>
                  {record.decisions[0].mode === "update" && (
                    <a
                      onClick={() => {
                        setRowsForEdit([record]);
                        setDecisionFormVisible(true);
                      }}
                    >
                      Edit <EditOutlined />
                    </a>
                  )}
                  <pre>{JSON.stringify(record.decisions[0], null, 4)}</pre>
                </React.Fragment>
              ) : (
                ""
              ),
          }}
        />
      )}
    </div>
  );
};

const mapContextToProps = ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
  projectKey,
  addError,
}) => ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
  projectKey,
  addError,
});

export default withContext(mapContextToProps)(WorkBench);
