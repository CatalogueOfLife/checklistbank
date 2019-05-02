import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  Form,
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
  Icon,
  Radio,
  Pagination,
  notification
} from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "../NameSearch/Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "../NameSearch/MultiValueFilter";
import RowDetail from "./RowDetail";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";
import { Resizable } from "react-resizable";
import DecisionTag from "../WorkBench/DecisionTag";
import ErrorMsg from "../../components/ErrorMsg";
import queryPresets from "./queryPresets";
import columnDefaults from "./columnDefaults";

const RadioGroup = Radio.Group;
const { Option, OptGroup } = Select;
const FormItem = Form.Item;

const ResizeableTitle = props => {
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
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      rawData: [],
      selectedRowKeys: [],
      sectors: [],
      filteredSectors: [],
      advancedMode: false,
      columns: columnDefaults.binomial,
      params: { limit: 50, offset: 0 },
      totalFaked: 0,
      loading: false,
      postingDecisions: false,
      decision: null,
      expandedRowKeys: []
    };
  }

  componentWillMount() {
    const { datasetKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
    /*  if (_.isEmpty(params)) {
      history.push({
        pathname: `/dataset/${datasetKey}/duplicates`,
        search: `?limit=50&offset=0`
      });
   } */
    this.getSectors();
    let booleans = {};
    ["withDecision", "parentDifferent", "authorshipDifferent"].forEach(n => {
      if (params[n] === "true") {
        booleans[n] = true;
      }
      if (params[n] === "false") {
        booleans[n] = false;
      }
    });


    this.setState(
      { params: { ...this.state.params, ...params, ...booleans } },
      this.getData
    );
  }

  getData = () => {
    const { params } = this.state;

    this.setState({ loading: true });
    const { datasetKey } = this.props;

    history.push({
      pathname: `/dataset/${datasetKey}/duplicates`,
      search: `?${qs.stringify({ ...params, limit: Number(params.limit) })}`
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify({
        ...params,
        limit: Number(params.limit) + 1
      })}`
    )
      .then(res => Promise.all(res.data.map(e => this.getDecisions(e))))
      .then(data => {
        const dataArr =
          data.length > Number(params.limit) ? data.slice(0, -1) : data;
        const {totalFaked} = this.state;
        this.setState({
          loading: false,
          data: dataArr
            .map((e, i) =>
              e.usages.map((u, id) => ({
                ...u.usage,
                dupID: i,
                dubKey: e.key,
                isFirstInGroup: id === 0 // not used ... keep?
              }))
            )
            .flat(), // create a flat array of all duplicate sets, use index in the original response as dupID for hold dupes together
          rawData: dataArr,
          columns: params.category
            ? columnDefaults[params.category]
            : columnDefaults.binomial,
          duplicateCount: dataArr.length,
          totalFaked: totalFaked > (data.length + Number(params.offset)) ? totalFaked : (data.length + Number(params.offset)),
          error: null
        });
      })
      .catch(err => {
        this.setState({
          loading: false,
          error: err,
          data: [],
          duplicateCount: 0
        });
      });
  };
  getSectors = () => {
    const { datasetKey } = this.props;
    axios(`${config.dataApi}sector?datasetKey=${datasetKey}`)
      .then(res => {
        this.setState({
          sectors: res.data,
          filteredSectors: res.data.map(o => ({
            value: o.key,
            text: _.get(o, "subject.name")
          }))
        });
      })
      .catch(err => {
        this.setState({ sectors: [] });
      });
  };
  getDecisions = data => {
    const promises = data.usages.map(d =>
      d.decision
        ? axios(`${config.dataApi}/decision/${_.get(d, "decision.key")}`).then(
            decision => {
              d.usage.decision = decision.data;
            }
          )
        : Promise.resolve()
    );
    return Promise.all(promises).then(() => data);
  };

  handleTableChange = (pagination, filters, sorter) => {
    let query = _.merge(this.state.params, {
      ...filters
    });

    this.setState({ params: query }, this.getData);
  };

  updateSearch = params => {
    this.setState(
      {
        params: { ...this.state.params, ...params, offset:0 },
        totalFaked:0,
        selectedPreset: undefined
      },
      this.getData
    );
  };

  resetSearch = () => {
    this.setState({ params: {limit: this.state.params.limit, offset: 0}, selectedPreset: undefined , totalFaked:0}, this.getData);
  };

  onPresetSelect = (value, option) => {
    const {
      props: { params }
    } = option;
    this.setState({ params: {...params, offset: 0, limit: this.state.params.limit}, selectedPreset: value, totalFaked:0 }, this.getData);
  };
  onSectorSearch = val => {
    const { sectors } = this.state;
    this.setState({
      filteredSectors: sectors
        .filter(s => s.subject.name.toLowerCase().startsWith(val))
        .map(o => ({ value: o.key, text: _.get(o, "subject.name") }))
    });
  };

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };
  onDecisionChange = decision => {
    this.setState({ decision });
  };
  applyDecision = () => {
    const { selectedRowKeys, data, decision } = this.state;
    const { datasetKey } = this.props;
    this.setState({ postingDecisions: true });
    const promises = data
      .filter(d => selectedRowKeys.includes(_.get(d, "id")))
      .map(d => {
        return axios
          .post(`${config.dataApi}decision`, {
            datasetKey: datasetKey,
            subject: {
              id: _.get(d, "name.id"),

              name: _.get(d, "name.scientificName"),
              authorship: _.get(d, "name.authorship"),
              rank: _.get(d, "name.rank")
            },
            mode: ["block", "chresonym"].includes(decision)
              ? decision
              : "update",
            status: ["block", "chresonym"].includes(decision)
              ? _.get(d, "status")
              : decision
          })

          .then(res => {
            const statusMsg = `Status changed to ${decision} for ${_.get(
              d,
              "name.scientificName"
            )}`;
            const decisionMsg = `${_.get(d, "name.scientificName")} was ${
              decision === "block" ? "blocked from the assembly" : ""
            }${decision === "chresonym" ? "marked as chresonym" : ""}`;

            notification.open({
              message: "Decision applied",
              description: ["block", "chresonym"].includes(decision)
                ? decisionMsg
                : statusMsg
            });
          })
          .catch(err => {
            notification.error({
              message: "Error",
              description: err.message
            });
          });
      });

    return Promise.all(promises)
      .then(res => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: [],
          decision: null,
          postingDecisions: false,
          decisionError: null
        });
      })
      .catch(err => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: [],
          decision: null,
          postingDecisions: false,
          decisionError: err
        });
      });
  };
  toggleAdvanced = () => {
    const { advancedMode } = this.state;
    this.setState({ advancedMode: !advancedMode });
  };

  components = {
    header: {
      cell: ResizeableTitle
    }
  };

  handleResize = index => (e, { size }) => {
    this.setState(({ columns }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width
      };
      return { columns: nextColumns };
    });
  };

  columnFilter = (c) => {
    const {params} = this.state;
    
    if(params.status && params.status.indexOf("synonym") === -1){
      return c.key !== "accepted"
    } else {
      return true
    }
  }
  render() {
    const {
      data,
      loading,
      error,
      params,
      selectedRowKeys,
      decision,
      postingDecisions,
      duplicateCount,
      advancedMode,
      totalFaked
    } = this.state;
    const { rank, taxonomicstatus } = this.props;
    const hasSelected =
      selectedRowKeys && selectedRowKeys.length > 0 && decision;
    const resizableColumns = !this.state.columns
      ? []
      : this.state.columns.map((col, index) => ({
          ...col,
          onHeaderCell: column => ({
            width: column.width,
            onResize: this.handleResize(index)
          })
        })).filter(this.columnFilter);

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      columnWidth: "30px"
    };


    return (
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0"
        }}
      >
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          )}
        </Row>

        <Row gutter={16}>
          <Col span={18}>
            <Card>
              <div style={{ marginBottom: "10px" }}>
                <Select
                  placeholder="CoL Check"
                  value={this.state.selectedPreset}
                  style={{ width: 500, marginRight: 10 }}
                  onChange={this.onPresetSelect}
                >
                  {queryPresets.map(p => (
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
                  <Icon type={this.state.advancedMode ? "up" : "down"} />
                </a>
              </div>
              {advancedMode && (
                <Form layout="inline">
                  <Select
                    placeholder="Min size"
                    value={params.minSize}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px"
                    }}
                    onChange={value => this.updateSearch({ minSize: value })}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <Option key={i} value={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Rank"
                    value={params.rank}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px"
                    }}
                    showSearch
                    onChange={value => this.updateSearch({ rank: value })}
                  >
                    {rank.map(r => (
                      <Option key={r} value={r}>
                        {r}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Name category"
                    value={params.category}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px"
                    }}
                    onChange={value => this.updateSearch({ category: value })}
                  >
                    <Option value="binomial">binomial</Option>
                    <Option value="trinomial">trinomial</Option>
                    <Option value="uninomial">uninomial</Option>
                  </Select>

                  <Select
                    placeholder="Status"
                    value={params.status}
                    style={{
                      width: 200,
                      marginRight: 10,
                      marginBottom: "10px"
                    }}
                    mode="multiple"
                    showSearch
                    onChange={value => this.updateSearch({ status: value })}
                  >
                    {taxonomicstatus.map(s => (
                      <Option value={s} key={s}>
                        {_.startCase(s)}
                      </Option>
                    ))}
                  </Select>

                  <AutoComplete
                    dataSource={this.state.sectors}
                    onSelect={value => this.updateSearch({ sectorKey: value })}
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
                      marginBottom: "10px"
                    }}
                  >
                    <Input suffix={<Icon type="search" />} />
                  </AutoComplete>

                  <FormItem label="Parent different">
                    <RadioGroup
                      onChange={evt => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "parentDifferent"
                              ])
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({
                            parentDifferent: evt.target.value
                          });
                        }
                      }}
                      value={params.parentDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>
                  <FormItem label="Authorship different">
                    <RadioGroup
                      onChange={evt => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "authorshipDifferent"
                              ])
                            },
                            this.getData
                          );
                        } else {
                          this.updateSearch({
                            authorshipDifferent: evt.target.value
                          });
                        }
                      }}
                      value={params.authorshipDifferent}
                    >
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                      <Radio value={undefined}>Ignore</Radio>
                    </RadioGroup>
                  </FormItem>

                  <FormItem label="With decision">
                    <RadioGroup
                      onChange={evt => {
                        if (typeof evt.target.value === "undefined") {
                          this.setState(
                            {
                              params: _.omit(this.state.params, [
                                "withDecision"
                              ])
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
                  </FormItem>
                  <FormItem label="Fuzzy matching">
                    <Switch
                      checked={params.mode === "FUZZY"}
                      onChange={value =>
                        this.updateSearch({ mode: value ? "FUZZY" : "STRICT" })
                      }
                    />
                  </FormItem>
                  <FormItem>
                    <Button type="danger" onClick={this.resetSearch}>
                      Reset all
                    </Button>
                  </FormItem>
                </Form>
              )}{" "}
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Select
                style={{ width: 140, marginRight: 10, marginBottom: "10px" }}
                onChange={this.onDecisionChange}
                placeholder="Pick decision"
              >
                <OptGroup label="Status">
                  {taxonomicstatus.map(s => (
                    <Option value={s} key={s}>
                      {_.startCase(s)}
                    </Option>
                  ))}
                </OptGroup>
                <OptGroup label="Other">
                  <Option value="block">Block</Option>
                  <Option value="chresonym">Chresonym</Option>
                </OptGroup>
              </Select>

              <Button
                type="primary"
                onClick={this.applyDecision}
                disabled={!hasSelected}
                style={{ width: 140 }}
                loading={postingDecisions}
              >
                Apply decision
              </Button>
              {selectedRowKeys &&
                selectedRowKeys.length > 0 &&
                `Selected ${selectedRowKeys.length} ${
                  selectedRowKeys.length > 1 ? "taxa" : "taxon"
                }`}
            </Card>
          </Col>
        </Row>
        <Row />
        <Row>
          <Col style={{ textAlign: "right", marginBottom: "8px", marginTop: "8px" }}>
            {!error && (
              <Pagination
              showSizeChanger
              pageSizeOptions={[50,100,250, 500]}
              onShowSizeChange={(current, size)=> {
                this.setState({params: {...this.state.params, limit: size}}, this.getData)
              }}
                onChange={(page, pageSize) => {

                  this.setState({params: {...this.state.params, offset: (page - 1) * this.state.params.limit}}, this.getData)
                  
                }}
                pageSize={this.state.params.limit}
                size="small"
                total={totalFaked}
              />
            )}
          </Col>
        </Row>
        {!error && (
          <React.Fragment>
            <Table
              size="small"
              components={this.components}
              columns={resizableColumns}
              dataSource={data}
              loading={loading}
              onChange={this.handleTableChange}
              rowKey="id"
              rowClassName={record =>
                record.dupID % 2 ? "duplicate-alternate-row" : ""
              }
              pagination={false}
              rowSelection={rowSelection}
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
  namefield
}) => ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield });

export default withContext(mapContextToProps)(DuplicateSearchPage);
