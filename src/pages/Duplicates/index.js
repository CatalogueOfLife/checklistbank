import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  Table,
  Alert,
  Select,
  Row,
  Col,
  Button,
  Switch,
  Card,
  AutoComplete,
  Input,
  Radio,
  Pagination,
  Tooltip,
  notification,
  Form,
} from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import { Resizable } from "react-resizable";
import ErrorMsg from "../../components/ErrorMsg";
import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";
import queryPresets from "./queryPresets";
import columnDefaults from "./columnDefaults";
import Auth from "../../components/Auth";
import { CanEditDataset } from "../../components/Auth/hasAccess";

import { getSectorsBatch } from "../../api/sector";
import { getDatasetsBatch } from "../../api/dataset";

import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const RadioGroup = Radio.Group;
const { Option, OptGroup } = Select;
const FormItem = Form.Item;
const ResizeableTitle = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable width={width} height={0} onResize={onResize}>
      <th {...restProps} />
    </Resizable>
  );
};

class DuplicateSearchPage extends React.Component {
  constructor(props) {
    super(props);
    const limit = localStorage.getItem("col_plus_duplicates_limit");
    const { assembly, catalogueKey } = props;
    this.state = {
      data: [],
      rawData: [],
      selectedRowKeys: [],
      sectors: [],
      filteredSectors: [],
      advancedMode: false,
      columns: columnDefaults(catalogueKey, this.getData).binomial,
      params: { limit: limit ? Number(limit) : 50, offset: 0 },
      page: 1,
      totalFaked: 0,
      loading: false,
      postingDecisions: false,
      decision: null,
      expandedRowKeys: [],
      allButOldestInGroupLoading: false,
      synonymsSelectLoading: false,
      newestInGroupLoading: false,
      showAtomizedNames: false,
    };
  }

  componentDidMount = () => {
    this.initOrUpdate();
  };

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "datasetKey") !== _.get(this.props, "datasetKey") ||
      _.get(prevProps, "catalogueKey") !== _.get(this.props, "catalogueKey")
    ) {
      this.initOrUpdate();
    }
  };

  initOrUpdate = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    this.sectorLoader = new DataLoader((ids) =>
      getSectorsBatch(ids, this.props.catalogueKey)
    );

    this.getSectors();
    let booleans = {};
    [
      "withDecision",
      "acceptedDifferent",
      "authorshipDifferent",
      "rankDifferent",
      "codeDifferent",
    ].forEach((n) => {
      if (params[n] === "true") {
        booleans[n] = true;
      }
      if (params[n] === "false") {
        booleans[n] = false;
      }
    });

    if (params._colCheck) {
      let option = {
        props: {
          params: queryPresets.filter((qp) => qp.id === params._colCheck)[0]
            .params,
        },
      };
      this.onPresetSelect(params._colCheck, option);
    } else {
      this.setState(
        { params: { ...this.state.params, ...params, ...booleans } },
        this.getData
      );
    }
  };

  decorateWithSectorsAndDataset = (res) => {
    if (!res.usages) return res;
    const { catalogueKey } = this.props;
    return Promise.all(
      res.usages
        .filter((tx) => _.get(tx, "usage.sectorKey"))
        .map((tx) =>
          this.sectorLoader
            .load(_.get(tx, "usage.sectorKey"), catalogueKey)
            .then((r) => {
              tx.sector = r;
              return datasetLoader
                .load(r.subjectDatasetKey)
                .then((dataset) => (tx.sector.dataset = dataset));
            })
        )
    ).then(() => res);
  };

  getData = async () => {
    const { params } = this.state;
    const {
      location: { pathname },
      catalogueKey,
    } = this.props;
    this.setState({ loading: true });
    const { datasetKey, assembly } = this.props;
    let prms = {
      ...params,
      limit: Number(params.limit),
    };
    if(catalogueKey){
      prms.catalogueKey = catalogueKey;
    } else {
      delete prms.withDecision
    }
    history.push({
      pathname: pathname,
      search: `?${qs.stringify({ ...prms, limit: Number(params.limit) })}`,
    });
    try {
      const res = await  axios(
        `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify(prms)}`
      )
      
      const netxtRes  = res.data?.result ? await Promise.all(res.data.result.map((e) => this.getDecisions(e))) : []
      const total = res.data?.total || 0;
     const data = assembly
     ? await Promise.all(netxtRes.map((e) => this.decorateWithSectorsAndDataset(e)))
     : netxtRes
       // .then((res) => Promise.all(res.data.result.map((e) => this.getDecisions(e))))
        /* .then((res) => {
          return assembly
            ? Promise.all(res.map((e) => this.decorateWithSectorsAndDataset(e)))
            : res;
        })
        .then((data) => { */
          const dataArr = data;
          const { totalFaked } = this.state;
          const clms = params.category
            ? columnDefaults(catalogueKey, this.getData)[params.category]
            : columnDefaults(catalogueKey, this.getData).binomial;
  
          this.setState({
            loading: false,
            data: dataArr
              .map((e, i) =>
                e.usages.map((u, id) => ({
                  ...u.usage,
                  sector: u.sector,
                  dupID: i,
                  dubKey: e.key,
                  classification: u.classification,
                  isFirstInGroup: id === 0, // not used ... keep?
                }))
              )
              .flat(), // create a flat array of all duplicate sets, use index in the original response as dupID for holding dupes together
            rawData: dataArr,
            columns: assembly ? [this.getGsdColumn(), ...clms] : clms,
            duplicateCount: dataArr.length,
            totalFaked: total
              /* totalFaked > data.length + Number(params.offset)
                ? totalFaked
                : data.length + Number(params.offset) */,
            error: null,
          });
    } catch (err) {
      this.setState({
        loading: false,
        error: err,
        data: [],
        duplicateCount: 0,
      });
    }

      /* }) */
     /*  .catch((err) => {
        this.setState({
          loading: false,
          error: err,
          data: [],
          duplicateCount: 0,
        });
      }); */
  };

  getGsdColumn = () => {
    return {
      title: "gsd",
      dataIndex: ["sector", "dataset", "alias"],
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <NavLink
            key={_.get(record, "id")}
            to={{
              pathname: `/dataset/${_.get(
                record,
                "sector.subjectDatasetKey"
              )}/taxon/${_.get(record, "sector.subject.id")}`,
            }}
            exact={true}
          >
            {_.get(record, "sector.dataset.alias") || _.get(record, "sector.dataset.title")}
          </NavLink>
        );
      },
    };
  };

  getSectors = () => {
    const { datasetKey, catalogueKey } = this.props;
    axios(
      `${config.dataApi}dataset/${catalogueKey}/sector?subjectDatasetKey=${datasetKey}`
    )
      .then((res) => {
        this.setState({
          sectors: res.data,
          filteredSectors: res.data.map((o) => ({
            value: o.key,
            text: _.get(o, "subject.name"),
          })),
        });
      })
      .catch((err) => {
        this.setState({ sectors: [] });
      });
  };
  getDecisions = (data) => {
    const { catalogueKey, assembly } = this.props;

    const promises = data.usages.map((d) =>
      d.decision
        ? axios(
            `${config.dataApi}dataset/${catalogueKey}/decision/${_.get(
              d,
              "decision.id"
            )}`
          ).then((decision) => {
            d.usage.decision = decision.data;
          })
        : Promise.resolve()
    );
    return Promise.all(promises).then(() => data);
  };

  handleTableChange = (pagination, filters, sorter) => {
    let query = _.merge(this.state.params, {
      ...filters,
    });

    this.setState({ params: query }, this.getData);
  };

  updateSearch = (params) => {

  
    this.setState(
      {
        params: _.pickBy(
          { ...this.state.params, ...params, offset: 0 },
          (val) =>  val === false || !!val
        ),
        totalFaked: 0,
        selectedPreset: undefined,
      },
      this.getData
    );
  };

  resetSearch = () => {
    this.setState(
      {
        params: { limit: this.state.params.limit, offset: 0 },
        selectedPreset: undefined,
        totalFaked: 0,
        selectedRowKeys: [],
      },
      this.getData
    );
  };

  onPresetSelect = (value, option) => {
    const {catalogueKey} = this.props;
    if (!value) {
      this.resetSearch();
    } else {
      const {
        props: { params },
      } = option;
      this.setState(
        {
          params: { ...params, offset: 0, limit: this.state.params.limit },
          selectedPreset: value,
          totalFaked: 0,
          decision: null,
          selectedRowKeys: [],
        },
        this.getData
      );
    }
  };
  onSectorSearch = (val) => {
    const { sectors } = this.state;
    this.setState({
      filteredSectors: sectors
        .filter((s) => s.subject.name.toLowerCase().startsWith(val))
        .map((o) => ({ value: o.key, text: _.get(o, "subject.name") })),
    });
  };

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };
  onDecisionChange = (decision) => {
    this.setState({ decision });
  };
  applyDecision = async () => {
    const { selectedRowKeys, data, decision } = this.state;
    const { datasetKey, catalogueKey, assembly } = this.props;
    this.setState({ postingDecisions: true });
    const promises = data
      .filter((d) => selectedRowKeys.includes(_.get(d, "id")))
      .map(async (d) => {
        const method = d.decision ? "put" : "post";
        const mode = ["block", "ignore", "reviewed"].includes(decision)
          ? decision
          : "update";
        const sourceSubject = assembly ? await axios(`${config.dataApi}dataset/${catalogueKey}/nameusage/${_.get(d, "id")}/source`) : null;
        const sourceId = sourceSubject?.data?.sourceId || null;
        
        const parent = ['accepted', 'provisionally accepted'].includes(d?.usage?.status) ? (d.classification && d.classification.length > 1
          ? d.classification[d.classification.length - 2].name
          : "") : _.get(d, "usage.accepted.name.scientificName", "");
        const body = {
          datasetKey: catalogueKey,
          subjectDatasetKey: assembly ? d?.sector?.dataset?.key : datasetKey,
          subject: {
            id: sourceId || _.get(d, "id"),
            parent: parent,      
            name: _.get(d, "name.scientificName"),
            authorship: _.get(d, "name.authorship"),
            rank: _.get(d, "name.rank"),
            status:  _.get(d, "status")
          },
          mode: mode,
          status: mode !== "update" ? _.get(d, "status") : decision,
        };

        return axios[method](
          `${config.dataApi}dataset/${catalogueKey}/decision${
            method === "put" ? `/${d.decision.id}` : ""
          }`,
          body
        )
          .then((decisionId) =>
            axios(
              `${config.dataApi}dataset/${catalogueKey}/decision/${
                method === "post" ? decisionId.data : d.decision.id
              }`
            )
          )
          .then((res) => {
            d.decision = res.data;
            if(selectedRowKeys.length <= 10){
                const statusMsg = `Status changed to ${decision} for ${_.get(
              d,
              "name.scientificName"
            )}`;
            const decisionMsg = `${_.get(d, "name.scientificName")} was ${
              decision === "block" ? "blocked from the assembly" : ""
            }${decision === "ignore" ? "ignored (Taxon blocked, but children kept and attached to parent)" : ""}${decision === "reviewed" ? "marked as reviewed": ""}`;

            notification.open({
              message: `Decision ${method === "post" ? "applied" : "changed"}`,
              description: ["block", "ignore", "reviewed"].includes(decision)
                ? decisionMsg
                : statusMsg,
            }); 
            }
          })
          .catch((err) => {
            notification.error({
              message: "Error",
              description: _.get(err, "response.data.message") || err.message,
            });
          });
      });

    return Promise.all(promises)
      .then((res) => {
        notification.open({
          message: `${promises.length > 1 ? 'Decisions' : 'Decision' } applied`,
          description: `${promises.length } ${promises.length > 1 ? 'names' : 'name'} affected`,
        });
        this.setState({
          data: [...this.state.data],
          selectedRowKeys: [],
          decision: null,
          postingDecisions: false,
          decisionError: null,
        });
      })
      .catch((err) => {
        this.setState({
          data: [...this.state.data],
          selectedRowKeys: [],
          decision: null,
          postingDecisions: false,
          decisionError: err,
        });
      });
  };
  toggleAdvanced = () => {
    const { advancedMode } = this.state;
    this.setState({ advancedMode: !advancedMode });
  };

  components = {
    header: {
      cell: ResizeableTitle,
    },
  };

  handleResize =
    (index) =>
    (e, { size }) => {
      this.setState(({ columns }) => {
        const nextColumns = [...columns];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        return { columns: nextColumns };
      });
    };

  columnFilter = (c) => {
    const { params } = this.state;

    if (params.status && params.status.indexOf("synonym") === -1) {
      return c.key !== "accepted";
    } else {
      return true;
    }
  };
  getLatestYear = (name) => {
    const basionymAuthorshipYear = Number(
      _.get(name, "basionymAuthorship.year", -1000)
    );
    const combinationAuthorshipYear = Number(
      _.get(name, "combinationAuthorship.year", -1000)
    );
    const publishedInYear = Number(_.get(name, "publishedInYear", -1000));
    return Math.max(
      basionymAuthorshipYear,
      combinationAuthorshipYear,
      publishedInYear
    );
  };
  selectNewestInGroup = () => {
    this.setState({ newestInGroupLoading: true });
    const { rawData } = this.state;
    let selectedRowKeys = [];
    rawData.forEach((group) => {
      const max = Math.max(
        ...group.usages.map((r) => this.getLatestYear(r.usage.name))
      );
      selectedRowKeys = [
        ...selectedRowKeys,
        ...group.usages
          .filter((r) => this.getLatestYear(r.usage.name) === max)
          .map((i) => i.usage.id),
      ];
    });
    this.setState({ selectedRowKeys, newestInGroupLoading: false });
  };

  selectAllInGroupExceptOldest = () => {
    this.setState({ allButOldestInGroupLoading: true });
    const { rawData } = this.state;
    let selectedRowKeys = [];
    rawData.forEach((group) => {
      const min = Math.min(
        ...group.usages.map((r) => r.usage.name.publishedInYear)
      );
      selectedRowKeys = [
        ...selectedRowKeys,
        ...group.usages
          .filter((r) => Number(r.usage.name.publishedInYear) > min)
          .map((i) => i.usage.id),
      ];
    });
    this.setState({ selectedRowKeys, allButOldestInGroupLoading: false });
  };

  selectAllSynonymsInGroup = () => {
    this.setState({ synonymsSelectLoading: true });
    const { rawData } = this.state;
    let selectedRowKeys = [];
    rawData.forEach((group) => {
      selectedRowKeys = [
        ...selectedRowKeys,
        ...group.usages
          .filter((r) => r.usage.status === "synonym")
          .map((i) => i.usage.id),
      ];
    });
    this.setState({ selectedRowKeys, synonymsSelectLoading: false });
  };

  exportDuplicates = () => {
    axios(
      `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify({
        ...params,
        catalogueKey: catalogueKey,
        limit: Number(params.limit) + 1,
      })}`
    );
  };

  render() {
    const {
      data,
      loading,
      error,
      params,
      page,
      selectedRowKeys,
      decision,
      postingDecisions,
      showAtomizedNames,
      advancedMode,
      totalFaked,
      columns,
      allButOldestInGroupLoading,
      synonymsSelectLoading,
      newestInGroupLoading,
    } = this.state;
    const { rank, taxonomicstatus, user, assembly, catalogueKey, datasetKey } =
      this.props;
      let queryParams = qs.parse(_.get(this.props, "location.search"));
    const hasSelected =
      selectedRowKeys && selectedRowKeys.length > 0 && decision;

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      columnWidth: "30px",
    };
    const { offset, ...downloadParams } = params;

    return (
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              description={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>

        <Row gutter={16}>
          <Col
            span={(Auth.canEditDataset({ key: catalogueKey }, user) && catalogueKey) ? 18 : 24}
          >
              <div style={{ marginBottom: "10px" }}>
                <Select
                  placeholder="COL Check"
                  value={this.state.selectedPreset}
                  style={{ width: 500, marginRight: 10 }}
                  onChange={this.onPresetSelect}
                  optionFilterProp="children"
                  showSearch
                  allowClear
                >
                  {queryPresets.map((p) => (
                    <Option key={p.id} value={p.id} params={p.params}>
                      {p.text}
                    </Option>
                  ))}
                </Select>
                <a
                  style={{ marginLeft: 8, fontSize: 12 }}
                  onClick={this.toggleAdvanced}
                >
                  Advanced{" "}
                  {this.state.advancedMode ? <UpOutlined /> : <DownOutlined />}
                </a>
              </div>
              {advancedMode && (
                <Form layout="inline">
                  {assembly && (
                    <DatasetAutocomplete
                      placeHolder="Source dataset"
                      style={{ marginBottom: "10px", width: "100%" }}
                      onSelectDataset={(value) =>
                        this.updateSearch({ sourceDatasetKey: value.key })
                      }
                      onResetSearch={() =>
                        this.updateSearch({ sourceDatasetKey: null })
                      }
                      defaultDatasetKey={
                        _.get(params, "sourceDatasetKey") || null
                      }
                    />
                  )}
                  <Input.Search
                    placeholder="Search names"
                    defaultValue={queryParams?.q || null}
                    style={{marginBottom: "10px"}}
                    onSearch={(value) =>
                      this.updateSearch({ q: value })
                    }
                    onReset={() =>
                      this.updateSearch({ q: null })
                    }
                    allowClear />
                  <Select
                    placeholder="Name category"
                    value={params.category}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px",
                    }}
                    onChange={(value) => this.updateSearch({ category: value })}
                    showSearch
                    allowClear
                  >
                    <Option value="binomial">binomial</Option>
                    <Option value="trinomial">trinomial</Option>
                    <Option value="uninomial">uninomial</Option>
                  </Select>

                  <Select
                    placeholder="Min size"
                    value={params.minSize}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px",
                    }}
                    onChange={(value) => this.updateSearch({ minSize: value })}
                    showSearch
                    allowClear
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <Option key={i} value={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>

                  <FormItem label="Fuzzy matching">
                    <Switch
                      checked={params.mode === "FUZZY"}
                      onChange={(value) =>
                        this.updateSearch({ mode: value ? "FUZZY" : "STRICT" })
                      }
                    />
                  </FormItem>
                  <Select
                    placeholder="Status"
                    value={params.status}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px",
                    }}
                    mode="multiple"
                    showSearch
                    allowClear
                    onChange={(value) => this.updateSearch({ status: value })}
                  >
                    {taxonomicstatus.map((s) => (
                      <Option value={s} key={s}>
                        {_.startCase(s)}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Rank"
                    value={params.rank}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px",
                    }}
                    mode="multiple"
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

                  <AutoComplete
                    onSelect={(value) =>
                      this.updateSearch({ sectorKey: value })
                    }
                    dataSource={this.state.filteredSectors}
                    onSearch={this.onSectorSearch}
                    placeholder={
                      this.state.sectors.length === 0
                        ? "No sectors"
                        : "Find sector"
                    }
                    disabled={this.state.sectors.length === 0}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px",
                    }}
                  >
                    <Input suffix={<SearchOutlined />} />
                  </AutoComplete>
                  <br />
                  <FormItem label="Authorship different">
                    <RadioGroup
                      onChange={(evt) => {
                        
                        if (evt.target.value === true || evt.target.value === false) {
                          this.updateSearch({
                            authorshipDifferent: evt.target.value,
                          });
                          
                        } else {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "authorshipDifferent",
                              ]),
                            },
                            this.getData
                          );
                        }
                      }}
                      value={params.authorshipDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>
                  <FormItem label="Accepted different">
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "acceptedDifferent",
                              ]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({
                            acceptedDifferent: evt.target.value,
                          });
                        }
                      }}
                      value={params.acceptedDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>

                  <FormItem label="Rank different">
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "rankDifferent",
                              ]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({
                            rankDifferent: evt.target.value,
                          });
                        }
                      }}
                      value={params.rankDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>

                  <FormItem label="Code different">
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "codeDifferent",
                              ]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({
                            codeDifferent: evt.target.value,
                          });
                        }
                      }}
                      value={params.codeDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>

                {catalogueKey &&  <FormItem label="With decision">
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "withDecision",
                              ]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({ withDecision: evt.target.value });
                        }
                      }}
                      value={params.withDecision}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem> }

                  <FormItem label="Entity">
                    <RadioGroup
                      onChange={(evt) => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, ["entity"]),
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({ entity: evt.target.value });
                        }
                      }}
                      value={params.entity}
                    >
                      <Radio value="NAME">Name</Radio>
                      <Radio value={undefined}>Taxon</Radio>
                    </RadioGroup>
                  </FormItem>

                  <FormItem label="Show atomized names">
                    <RadioGroup
                      onChange={(evt) => {
                        this.setState({ showAtomizedNames: evt.target.value });
                      }}
                      value={showAtomizedNames}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                    </RadioGroup>
                  </FormItem>

                  <FormItem>
                    <Button type="danger" onClick={this.resetSearch}>
                      Reset all
                    </Button>
                  </FormItem>
                </Form>
              )}{" "}
          </Col>
         {catalogueKey && <CanEditDataset dataset={{ key: catalogueKey }}>
            <Col flex="auto"></Col>
            <Col >
                <Select
                  style={{
                    width: 140,
                    marginRight: 10,
                    marginBottom: "10px",
                  }}
                  onChange={this.onDecisionChange}
                  value={decision ? decision : undefined}
                  placeholder="Pick decision"
                  showSearch
                  allowClear
                >
                  <OptGroup label="Status">
                    {taxonomicstatus.map((s) => (
                      <Option value={s} key={s}>
                        {_.startCase(s)}
                      </Option>
                    ))}
                  </OptGroup>
                  <OptGroup label="Other">
                    <Option value="block">Block</Option>
                    <Option value="ignore">Ignore</Option>
                    <Option value="reviewed">Reviewed</Option>
                  </OptGroup>
                </Select>
                <br />
                <Button
                  type="primary"
                  onClick={this.applyDecision}
                  disabled={!hasSelected}
                  style={{ width: 140 }}
                  loading={postingDecisions}
                >
                  Apply decision
                </Button>
                {selectedRowKeys && selectedRowKeys.length > 0 && (
                  <div>
                    Selected {selectedRowKeys.length}{" "}
                    {selectedRowKeys.length > 1 ? "taxa" : "taxon"}
                  </div>
                )}
            </Col>
          </CanEditDataset>}
        </Row>
        <Row style={{ marginBottom: "8px", marginTop: "12px" }}>
          <Col span={12}>
          {(Auth.canEditDataset({ key: catalogueKey }, user) && catalogueKey ) &&  <>
            <Tooltip title="At least two names in a group must have different publishedInYear for a name to be selected">
              <Button
                type="primary"
                onClick={this.selectNewestInGroup}
                style={{ width: 140, marginRight: "10px" }}
                loading={newestInGroupLoading}
              >
                Most recent name
              </Button>
            </Tooltip>
            <Tooltip title="At least two names in a duplicate group must have different publishedInYear for a name to be selected">
              <Button
                type="primary"
                onClick={this.selectAllInGroupExceptOldest}
                loading={allButOldestInGroupLoading}
                style={{ width: 140, marginRight: "10px" }}
              >
                All except oldest
              </Button>
            </Tooltip>
            <Button
              type="primary"
              onClick={this.selectAllSynonymsInGroup}
              loading={synonymsSelectLoading}
              style={{ width: 140 }}
            >
              All synonyms
            </Button>
            </>}
            <Button
              type="link"
              download="duplicates.csv"
              href={`${
                config.dataApi
              }dataset/${datasetKey}/duplicate.csv?${qs.stringify({
                ...downloadParams,
                catalogueKey: catalogueKey,
              })}`}
            >
              <DownloadOutlined /> CSV
            </Button>
            <Button
              type="link"
              download="duplicates.tsv"
              href={`${
                config.dataApi
              }dataset/${datasetKey}/duplicate.tsv?${qs.stringify({
                ...downloadParams,
                catalogueKey: catalogueKey,
              })}`}
            >
              <DownloadOutlined /> TSV
            </Button>
          </Col>
          <Col
            span={Auth.canEditDataset({ key: catalogueKey }, user) ? 12 : 24}
            style={{ textAlign: "right" }}
          >
            {data.length + " names on this page"}
            {!error && (
              <Pagination
                style={{ display: "inline" }}
                showSizeChanger
                current={page}
                pageSizeOptions={["50", "100", "250", "500"]}
                onShowSizeChange={(current, size) => {
                  localStorage.setItem("col_plus_duplicates_limit", size);
                  this.setState(
                    {
                      params: { ...this.state.params, limit: size, offset: 0 },
                      page: 1
                    },
                    this.getData
                  );
                }}
                onChange={(page, pageSize) => {
                  this.setState(
                    {
                      params: {
                        ...this.state.params,
                        offset: page === 0 ? page : (page - 1) * pageSize,
                        limit: pageSize,
                      },
                      page
                    },
                    this.getData
                  );
                }}
                pageSize={Number(this.state.params.limit)}
                size="small"
                total={totalFaked}
                locale={{ items_per_page: " duplicates / page" }}
              />
            )}
          </Col>
        </Row>
        {!error && (
          <React.Fragment>
            <Table
              size="small"
              components={this.components}
              columns={
                showAtomizedNames === true
                  ? columns.filter(this.columnFilter)
                  : assembly
                  ? [
                      this.getGsdColumn(),
                      ...columnDefaults(catalogueKey, this.getData)
                        .fullScientificName,
                    ]
                  : columnDefaults(catalogueKey, this.getData)
                      .fullScientificName
              }
              dataSource={data}
              loading={loading}
              onChange={this.handleTableChange}
              rowKey="id"
              rowClassName={(record) =>
                record.dupID % 2 ? "duplicate-alternate-row" : ""
              }
              pagination={false}
              rowSelection={
                (!Auth.canEditDataset({ key: catalogueKey }, user) || !catalogueKey)
                  ? null
                  : rowSelection
              }
            />
          </React.Fragment>
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
}) => ({
  rank,
  taxonomicstatus,
  issue,
  nomstatus,
  nametype,
  namefield,
  user,
});

export default withContext(mapContextToProps)(DuplicateSearchPage);
