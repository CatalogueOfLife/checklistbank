import React from "react";
import PropTypes from "prop-types";
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
  notification,
  Switch,
  Form,
} from "antd";
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
import NameAutocomplete from "../catalogue/Assembly/NameAutocomplete";

const { Option, OptGroup } = Select;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const columnFilters = ["status", "rank"];
const FACETS = ["rank", "issue", "status", "nomStatus", "nameType", "field"];
const PAGE_SIZE = 50;
const getDecisionText = (decision) => {
  if (!_.get(decision, "mode")) {
    return "";
  } else if (["block", "chresonym"].includes(_.get(decision, "mode"))) {
    return _.get(decision, "mode");
  } else if (_.get(decision, "status")) {
    return _.get(decision, "status");
  } else {
    return "update";
  }
};

const getColumns = (catalogueKey, user) => [
  {
    title: "Decision",
    dataIndex: "decisions",
    key: "decisions",
    width: 60,
    className: "workbench-td",
    render: (text, record) =>
      !Auth.isAuthorised(user, ["editor"]) ? (
        getDecisionText(_.get(record, "decisions[0]"))
      ) : (
        <DecisionTag
          decision={_.get(record, "decisions[0]")}
          catalogueKey={catalogueKey}
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
          ? `/catalogue/${catalogueKey}/dataset/${_.get(
              record,
              "usage.name.datasetKey"
            )}/name/${encodeURIComponent(_.get(record, "usage.name.id"))}`
          : `/catalogue/${catalogueKey}/dataset/${_.get(
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
              exact={true}
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
          baseUri={`/catalogue/${catalogueKey}/dataset/${_.get(
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

class WorkBench extends React.Component {
  constructor(props) {
    super(props);
    const { catalogueKey } = this.props;
    const { user } = this.props;
    this.state = {
      data: { result: [] },
      decision: null,
      columns: getColumns(catalogueKey, user),
      decisionFormVisible: false,
      rowsForEdit: [],
      params: {},
      pagination: {
        pageSize: 50,
        current: 1,
        showQuickJumper: true,
      },
      loading: false,
      selectedRowKeys: [],
      filteredInfo: null,
      advancedFilters: false,
    };
  }

  componentDidMount() {
    const { datasetKey, catalogueKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: 50, offset: 0, facet: FACETS };
      history.push({
        pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/workbench`,
        search: `?limit=50&offset=0`,
      });
    } else if (!params.facet) {
      params.facet = FACETS;
    }
    params.offset = params.offset || 0;
    params.limit = params.limit || 50;
    // columnFilters.forEach((param) => this.updateFilter(params, params, param));
    this.setState(
      {
        params,
        pagination: {
          pageSize: params.limit || PAGE_SIZE,
          current:
            Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) + 1,
          showQuickJumper: true,
          pageSizeOptions: [50, 100, 500, 1000],
        },
      },
      this.getData
    );
  }

  componentDidUpdate = (prevProps) => {
    const { datasetKey, catalogueKey } = this.props;

    if (
      _.get(prevProps, "datasetKey") !== _.get(this.props, "datasetKey") ||
      _.get(prevProps, "catalogueKey") !== _.get(this.props, "catalogueKey")
    ) {
      const params = { limit: PAGE_SIZE, offset: 0, facet: FACETS };
      history.push({
        pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/workbench`,
        search: `?limit=50&offset=0`,
      });
      // columnFilters.forEach((param) => this.updateFilter(params, {}, param));
      this.setState(
        {
          params,
          pagination: {
            pageSize: params.limit || PAGE_SIZE,
            current:
              Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) +
              1,
            showQuickJumper: true,
            pageSizeOptions: [50, 100, 500, 1000],
          },
        },
        this.getData
      );
    }
    if (!prevProps.user && this.props.user) {
      this.setState({ columns: getColumns(catalogueKey, this.props.user) });
    }
  };

  getData = () => {
    const {
      params,
      pagination: { pageSize: limit, current },
    } = this.state;

    this.setState({ loading: true });

    const { datasetKey, catalogueKey } = this.props;
    if (!params.q) {
      delete params.q;
    }
    const newParamsWithPaging = {
      ...params,
      limit,
      offset: (current - 1) * limit,
    };
    history.push({
      pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/workbench`,
      search: `?${qs.stringify(newParamsWithPaging)}`,
    });
    // This would be cleaner with pathparam like:  /catalogue/3/dataset/1700/nameusage/search
    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/search?${qs.stringify({
        ...newParamsWithPaging,
        catalogueKey: catalogueKey,
      })}`
    )
      .then((res) => this.getDecisions(res))
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination: { ...this.state.pagination, total: res.data.total },
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getDecisions = (res) => {
    const { catalogueKey } = this.props;
    const promises = _.get(res, "data.result")
      ? res.data.result.map((d) => {
          return _.get(d, "decisions[0]")
            ? axios(
                `${config.dataApi}/dataset/${catalogueKey}/decision/${_.get(
                  d,
                  "decisions[0].id"
                )}`
              ).then((decision) => {
                if (decision.data) {
                  d.decisions = [decision.data];
                }
              })
            : Promise.resolve(false);
        })
      : [];
    return Promise.all(promises).then(() => res);
  };
  handleTableChange = (pagination, filters, sorter) => {
    console.log(_.get(this.state, "params"));
    let query = {
      ...this.state.params,
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
    //  columnFilters.forEach((param) => this.updateFilter(query, filters, param));

    this.setState(
      { params: query, filteredInfo: filters, pagination },
      this.getData
    );
  };

  updateSearch = (params) => {
    let newParams = { ...this.state.params };
    _.forEach(params, (v, k) => {
      newParams[k] = v;
    });
    this.setState(
      {
        params: newParams,
        pagination: { ...this.state.pagination, current: 1 },
      },
      this.getData
    );
  };

  updateFilter = (query, filters, param) => {
    const { columns } = this.state;
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
  resetSearch = () => {
    const { datasetKey, catalogueKey } = this.props;
    history.push({
      pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/workbench`,
      search: `?limit=${PAGE_SIZE}&offset=0`,
    });
    this.setState(
      {
        params: { facet: FACETS },
        filteredInfo: null,
        pagination: {
          ...this.state.pagination,
          current: 1,
          pageSize: PAGE_SIZE,
        },
      },
      this.getData
    );
  };

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  onDecisionChange = (decision) => {
    this.setState({ decision });
  };
  cancelDecisionForm = () => {
    this.setState({
      decisionFormVisible: false,
      decisionForEdit: null,
      rowsForEdit: [],
    });
  };
  applyDecision = () => {
    const {
      selectedRowKeys,
      data: { result },
      decision,
    } = this.state;
    const { datasetKey, catalogueKey, taxonomicstatus } = this.props;
    const promises = result
      .filter((d) => selectedRowKeys.includes(_.get(d, "usage.id")))
      .map((d) => {
        let decisionObject = {
          subjectDatasetKey: datasetKey,
          subject: {
            id: _.get(d, "usage.id"),
            name: _.get(d, "usage.name.scientificName"),
            authorship: _.get(d, "usage.name.authorship"),
            rank: _.get(d, "usage.name.rank"),
            status: _.get(d, "usage.status"),
            parent:
              d.classification && d.classification.length > 1
                ? d.classification[d.classification.length - 2].name
                : "",
            code: _.get(d, "usage.name.code"),
          },
          mode: ["block", "chresonym"].includes(decision) ? decision : "update",
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
            `${config.dataApi}dataset/${catalogueKey}/decision`,
            decisionObject
          )

          .then((res) => {
            d.decisions = [{ id: res.data }];
            const statusMsg = `Status changed to ${decision} for ${_.get(
              d,
              "usage.name.scientificName"
            )}`;
            const decisionMsg = `${_.get(d, "usage.name.scientificName")} was ${
              decision === "block" ? "blocked from the assembly" : ""
            }${decision === "chresonym" ? "marked as chresonym" : ""}`;

            notification.open({
              message: "Decision applied",
              description: ["block", "chresonym"].includes(decision)
                ? decisionMsg
                : statusMsg,
            });
          });
      });

    return Promise.all(promises)
      .then((res) => {
        return this.getDecisions(this.state);
      })
      .then((res) => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: [],
          decisionFormVisible: false,
          decision: null,
          decisionError: null,
        });
      })
      .catch((err) => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: [],
          decisionFormVisible: false,
          decision: null,
          decisionError: err,
        });
      });
  };
  toggleAdvancedFilters = () => {
    this.setState({ advancedFilters: !this.state.advancedFilters });
  };
  render() {
    const {
      data: { result, facets },
      loading,
      error,
      params,
      pagination,
      selectedRowKeys,
      filteredInfo,
      columns,
      decision,
      decisionFormVisible,
      rowsForEdit,
      advancedFilters,
    } = this.state;
    const {
      rank,
      taxonomicstatus,
      user,
      datasetKey,
      catalogueKey,
    } = this.props;
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
    const facetTaxonomicStatus = _.get(facets, "status")
      ? facets.status.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
    const facetNomStatus = _.get(facets, "nomstatus")
      ? facets.nomstatus.map((s) => ({
          value: s.value,
          label: `${_.startCase(s.value)} (${s.count.toLocaleString("en-GB")})`,
        }))
      : [];
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

    /*     columns[2].filters = facetTaxonomicStatus
      ? facetTaxonomicStatus.map((s) => ({ value: s.value, text: s.label }))
      : taxonomicstatus.map((s) => ({ value: s, text: _.startCase(s) }));
    columns[2].filteredValue = _.get(filteredInfo, "status") || null;
    columns[9].filters =
      facetRanks || rank.map((s) => ({ value: s, text: _.startCase(s) }));
    columns[9].filteredValue = _.get(filteredInfo, "rank") || null; */
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
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
            onCancel={this.cancelDecisionForm}
            onOk={() => {
              this.cancelDecisionForm();
              this.setState({ selectedRowKeys: [] });
            }}
            onSaveDecision={(name) => {
              return this.getDecisions({ data: { result: [name] } }).then(
                (res) => {
                  this.setState({ data: this.state.data });
                }
              );
            }}
            datasetKey={catalogueKey}
            subjectDatasetKey={datasetKey}
          />
        )}
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>
        <Row style={{ marginBottom: "10px" }}>
          <Col span={14} style={{ display: "flex", flexFlow: "column" }}>
            <SearchBox
              defaultValue={_.get(params, "q")}
              onSearch={(value) => this.updateSearch({ q: value })}
              style={{ marginBottom: "10px", width: "100%" }}
            />
            <div style={{ marginTop: "10px" }}>
              {" "}
              <NameAutocomplete
                datasetKey={datasetKey}
                minRank="GENUS"
                onSelectName={(value) => {
                  this.updateSearch({ TAXON_ID: value.key });
                }}
                onResetSearch={this.resetSearch}
                placeHolder="Filter by higher taxon"
                defaultTaxonKey={params.TAXON_ID || null}
                autoFocus={false}
              />{" "}
            </div>
            <div style={{ marginTop: "10px" }}>
              <Form layout="inline">
                <FormItem label="Fuzzy">
                  <Switch
                    checked={params.fuzzy === true}
                    onChange={(value) => this.updateSearch({ fuzzy: value })}
                  />
                </FormItem>
                <FormItem label="Matching">
                  <RadioGroup
                    onChange={(evt) => {
                      this.updateSearch({ type: evt.target.value });
                    }}
                    value={params.type || "WHOLE_WORDS"}
                  >
                    <Radio value="EXACT">Exact</Radio>
                    <Radio value="WHOLE_WORDS">Words</Radio>
                    <Radio value="PREFIX">Partial</Radio>
                  </RadioGroup>
                </FormItem>

                <FormItem
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
                    <Radio value="_NOT_NULL">Exclude bare names</Radio>
                    <Radio value="_NULL">Only bare names</Radio>
                    <Radio value={undefined}>All</Radio>
                  </RadioGroup>
                </FormItem>
              </Form>
            </div>

            <Button
              type="danger"
              onClick={this.resetSearch}
              style={{ width: "120px" }}
            >
              Reset search
            </Button>
          </Col>
          <Col span={10}>
            <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={(value) => this.updateSearch({ issue: value })}
              vocab={facetIssues}
              label="Issues"
            />

            <MultiValueFilter
              defaultValue={_.get(params, "rank")}
              onChange={(value) => this.updateSearch({ rank: value })}
              vocab={facetRanks}
              label="Ranks"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "status")}
              onChange={(value) => this.updateSearch({ status: value })}
              vocab={facetTaxonomicStatus}
              label="Status"
            />
            {advancedFilters && (
              <React.Fragment>
                <MultiValueFilter
                  defaultValue={_.get(params, "nomStatus")}
                  onChange={(value) => this.updateSearch({ nomstatus: value })}
                  vocab={facetNomStatus}
                  label="Nomenclatural status"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "nameType")}
                  onChange={(value) => this.updateSearch({ type: value })}
                  vocab={facetNomType}
                  label="Name type"
                />
                <MultiValueFilter
                  defaultValue={_.get(params, "field")}
                  onChange={(value) => this.updateSearch({ field: value })}
                  vocab={facetNomField}
                  label="Name field"
                />
              </React.Fragment>
            )}
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <a
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={this.toggleAdvancedFilters}
              >
                Advanced{" "}
                {this.state.advancedFilters ? <UpOutlined /> : <DownOutlined />}
              </a>

              {/* <Switch checkedChildren="Advanced" unCheckedChildren="Advanced" onChange={this.toggleAdvancedFilters} /> */}
            </div>
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <FormItem
                style={{
                  marginLeft: "10px",
                  marginBottom: "10px",
                }}
              >
                <RadioGroup
                  onChange={(evt) => {
                    if (typeof evt.target.value === "undefined") {
                      this.setState(
                        {
                          params: _.omit(this.state.params, ["decisionMode"]),
                        },
                        this.getData
                      );
                    } else {
                      this.updateSearch({ decisionMode: evt.target.value });
                    }
                  }}
                  value={params.decisionMode}
                >
                  <Radio value="_NOT_NULL">With decision</Radio>
                  <Radio value="_NULL">Without decision</Radio>
                  <Radio value={undefined}>All</Radio>
                </RadioGroup>
              </FormItem>
            </div>
          </Col>
        </Row>
        <Row>
          {Auth.isAuthorised(this.props.user, ["editor"]) && (
            <Col span={16} style={{ textAlign: "left", marginBottom: "8px" }}>
              <Select
                style={{ width: 200, marginRight: 10 }}
                onChange={this.onDecisionChange}
                allowClear
                showSearch
              >
                <OptGroup label="General">
                  <Option value="block">Block</Option>
                  <Option value="chresonym">Chresonym</Option>
                </OptGroup>
                <OptGroup label="Status">
                  {taxonomicstatus.map((s) => (
                    <Option value={s} key={s}>
                      {_.startCase(s)}
                    </Option>
                  ))}
                </OptGroup>
                <OptGroup label="Name type">
                  <Option value="no name">No name</Option>
                  <Option value="placeholder">Placeholder</Option>
                  <Option value="hybrid formula">Hybrid formula</Option>
                  <Option value="informal">Informal</Option>
                </OptGroup>
              </Select>
              <Button
                type="primary"
                onClick={() => this.applyDecision()}
                disabled={!hasSelected || !decision}
                loading={loading}
                style={{ marginRight: 10 }}
              >
                Apply selected decision
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  this.setState({
                    decisionFormVisible: true,
                    rowsForEdit: result.filter((r) =>
                      selectedRowKeys.includes(_.get(r, "usage.id"))
                    ),
                  })
                }
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
            span={!Auth.isAuthorised(this.props.user, ["editor"]) ? 24 : 8}
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
        {!error && (
          <Table
            scroll={{ x: 3000, y: 600 }}
            size="small"
            components={this.components}
            bordered
            columns={columns}
            dataSource={result}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey={(record) => _.get(record, "usage.id")}
            rowSelection={
              !Auth.isAuthorised(user, ["editor"]) ? null : rowSelection
            }
            expandedRowRender={
              !Auth.isAuthorised(user, ["editor"])
                ? null
                : (record) =>
                    _.get(record, "decisions[0]") ? (
                      <React.Fragment>
                        {record.decisions[0].mode === "update" && (
                          <a
                            onClick={() => {
                              this.setState({
                                rowsForEdit: [record],
                                decisionFormVisible: true,
                              });
                            }}
                          >
                            Edit <EditOutlined />
                          </a>
                        )}
                        <pre>
                          {JSON.stringify(record.decisions[0], null, 4)}
                        </pre>
                      </React.Fragment>
                    ) : (
                      ""
                    )
            }
          />
        )}
      </div>
    );
  }
}

const mapContextToProps = ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
  catalogueKey,
}) => ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
  catalogueKey,
});

export default withContext(mapContextToProps)(WorkBench);
