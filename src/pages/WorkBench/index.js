import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Icon, Row, Col, Button, Select, Tag, notification } from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "../NameSearch/Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "../NameSearch/MultiValueFilter";
import DecisionTag from "./DecisionTag";
import CopyableColumnText from "./CopyableColumnText"
import _ from "lodash";
import ResizeableTitle from "./ResizeableTitle";
import withContext from "../../components/hoc/withContext";
import {stringToColour} from "../../components/util"
import ErrorMsg from '../../components/ErrorMsg'

const { Option, OptGroup } = Select;

const columnFilters = ["status", "rank"];


class WorkBench extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      decision: null,
      columns: this.defaultColumns,
      params: {},
      pagination: {
        pageSize: 50,
        current: 1,
        showQuickJumper: true
      },
      loading: false,
      selectedRowKeys: [],
      filteredInfo: null
    };
  }
  defaultColumns  = [
    {
      title: "Index Id",
      dataIndex: "usage.name.nameIndexId",
      key: "nameIndexId",
      width: 60,
      className: "workbench-td",
      render: (text, record) => 
      <React.Fragment>
        {text && <Tag color={stringToColour(text)} style={{width:"40px", verticalAlign: 'middle'}}>{
        <CopyableColumnText text={text} width="30px"/>
         }</Tag>}

<NavLink
          key={_.get(record, "usage.id")}
          to={{
            pathname: `/dataset/${_.get(record, "usage.name.datasetKey")}/${
              _.get(record, "usage.bareName") ? "name" : "taxon"
            }/${encodeURIComponent(
              _.get(record, "usage.accepted.id") ? _.get(record, "usage.accepted.id") : _.get(record, "usage.id")
            )}`
          }}
          exact={true}
        >
        <Icon  type="link"/> 
        </NavLink>

      </React.Fragment>
      

    },
    {
      title: "Decision",
      dataIndex: "decisions",
      key: "decisions",
      width: 60,
      className: "workbench-td",
      render: (text, record) => <DecisionTag decision={_.get(record, 'decisions[0]')}/>
    },
    {
      title: "Name ID",
      dataIndex: "usage.name.id",
      key: "nameId",
      width: 50,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="40px" />
    },
    {
      title: "Status",
      dataIndex: "usage.status",
      key: "status",
      width: 90,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="60px" />

    },
    {
      title: "ScientificName",
      dataIndex: "usage.name.formattedName",
      width: 240,
      className: "workbench-td",
      render: (text, record) => 
       <span
      dangerouslySetInnerHTML={{
        __html: _.get(record, "usage.name.formattedName")
      }}
    />,
      sorter: true
    },
    {
      title: "Uninomial",
      width: 160,
      dataIndex: "usage.name.uninomial",
      key: "uninomial",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="150px" />

    },
    {
      title: "Genus",
      width: 160,
      dataIndex: "usage.name.genus",
      key: "genus",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="150px" />

    },
    {
      title: "specificEpithet",
      width: 160,
      dataIndex: "usage.name.specificEpithet",
      key: "specificEpithet",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="150px" />

    },
    {
      title: "infraspecificEpithet",
      width: 160,
      dataIndex: "usage.name.infraspecificEpithet",
      key: "infraspecificEpithet",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="150px" />

    },
    {
      title: "Authorship",
      width: 240,
      dataIndex: "usage.name.authorship",
      key: "authorship",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="230px" />

    },
  
    {
      title: "Rank",
      width: 100,
      dataIndex: "usage.name.rank",
      key: "rank",
      sorter: true,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="90px" />

    },
    {
      title: "acceptedScientificName",
      width: 240,
      dataIndex: "usage.accepted.name.formattedName",
      className: "workbench-td",
      render: (text, record) => {
        return !["synonym", "ambiguous synonym", "misapplied"].includes(
          _.get(record, "usage.status")
        ) ? (
          ""
        ) : (
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "usage.accepted.name.formattedName")
            }}
          />
        );
      },
    },
    {
      title: "Classification",
      dataIndex: "usage.classification",
      key: "classification",
      width: 400,
      className: "workbench-td",
      render: (text, record) => {
        return !_.get(record, "classification") ? (
          ""
        ) : (
          <Classification
            key={_.get(record, 'usage.id')}
            classification={_.initial(record.classification)}
            datasetKey={_.get(record, "usage.name.datasetKey")}
          />
        );
      }
    }
  ]; 

  componentWillMount() {
    const { datasetKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
    if (_.isEmpty(params)) {
      params = { limit: 50, offset: 0, facet: ["rank", "issue", "status"] };
      history.push({
        pathname: `/dataset/${datasetKey}/workbench`,
        search: `?limit=50&offset=0`
      });
    } else if (!params.facet) {
      params.facet = ["rank", "issue", "status"];
    }
    columnFilters.forEach(param => this.updateFilter(params, {}, param));

    this.setState({ params }, this.getData);
  }

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey } = this.props;
    if (!params.q) {
      delete params.q;
    }
    history.push({
      pathname: `/dataset/${datasetKey}/workbench`,
      search: `?${qs.stringify(params)}`
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/name/search?${qs.stringify(
        params
      )}`
    )
    .then(res => this.getDecisions(res))
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data,
          err: null,
          pagination
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getDecisions = (res) => {
    const promises = _.get(res, 'data.result') ? res.data.result.map(d => {
      return axios(
        `${config.dataApi}/decision?id=${_.get(d, 'usage.name.id')}`
      ).then(decisions => {
        if(decisions.data && decisions.data.length > 0){
          d.decisions = decisions.data

        }
      })
    }) : []
    return Promise.all(promises).then(() => res)
  }
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({
      pagination: pager
    });
    console.log(_.get(this.state, "params"));
    let query = {
      ...this.state.params,
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ..._.pickBy(filters)
    };

    if (sorter && sorter.field) {
      let split = sorter.field.split(".");

      if (split[split.length - 1] === "formattedName") {
        query.sortBy = "name";
      } else if (split[split.length - 1] === "rank") {
        query.sortBy = "taxonomic";
      } else {
        query.sortBy = split[split.length - 1];
      }
    }
    if (sorter && sorter.order === "descend") {
      query.reverse = true;
    } else {
      query.reverse = false;
    }
    columnFilters.forEach(param => this.updateFilter(query, filters, param));

    this.setState({ params: query, filteredInfo: filters }, this.getData);
  };

  updateSearch = params => {
    _.forEach(params, (v, k) => {
      this.state.params[k] = v;
    });
    this.setState({ ...this.state.params }, this.getData);
  };
  updateFilter = (query, filters, param) => {
    const { columns } = this.state;
    if (filters[param] && _.get(filters, `${param}.length`)) {
      query[param] = filters[param];
    } else if (!filters[param]) {
      delete query[param];
    }
    let catColumn = _.find(columns, c => {
      return c.key === param;
    });
    let filter =
      typeof query[param] === "string" ? [query[param]] : query[param];
    catColumn.filteredValue = filter;
  };
  resetSearch = () => {
    const { datasetKey } = this.props;
    history.push({
      pathname: `/dataset/${datasetKey}/workbench`,
      search: `?limit=50&offset=0`
    });
    this.setState(
      {
        params: { limit: 50, offset: 0, facet: ["rank", "issue", "status"] },
        filteredInfo: null
      },
      this.getData
    );
  };

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  onDecisionChange = decision => {
    this.setState({ decision });
  };

  applyDecision = () => {
    const {selectedRowKeys, data: {result}, decision} = this.state;
    const { datasetKey } = this.props;
   const promises = result
      .filter(d => selectedRowKeys.includes(_.get(d, 'usage.name.id')))
      .map(d => {
       return axios.post(
          `${config.dataApi}decision`, {
            datasetKey: datasetKey,
            subject: {
              id: _.get(d, 'usage.name.id'),
              
              name: _.get(d, 'usage.name.scientificName'),
              authorship: _.get(d, 'usage.name.authorship'),
              rank: _.get(d, 'usage.name.rank')
            },
            mode: ['block','chresonym'].includes(decision) ? decision : 'update',
            status: ['block','chresonym'].includes(decision) ? _.get(d, 'usage.status') : decision

          }
        )
        
          .then(res => {
            const statusMsg = `Status changed to ${decision} for ${_.get(d, 'usage.name.scientificName')}`
            const decisionMsg = `${_.get(d, 'usage.name.scientificName')} was ${decision === 'block' ? 'blocked from the assembly' : ''}${decision === 'chresonym' ? 'marked as chresonym': ''}`

            notification.open({
              message: "Decision applied",
              description: ['block','chresonym'].includes(decision) ? decisionMsg : statusMsg
            });
            
          })
          
      })

      return Promise.all(promises).then(res => {
        return this.getDecisions(this.state)
      })
      .then(res => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: null,
          decision: null,
          decisionError: null
        });
      })
      .catch(err => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: null,
          decision: null,
          decisionError: err
        });
      });

  }

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
      decision
    } = this.state;
    const {
      rank,
      taxonomicstatus,
      issue,
      nomstatus,
      nametype,
      namefield
    } = this.props;
    const facetRanks = _.get(facets, "rank")
      ? facets.rank.map(r => ({
          value: r.value,
          text: `${_.startCase(r.value)} (${r.count})`
        }))
      : null;
    const facetIssues = _.get(facets, "issue")
      ? facets.issue.map(i => ({
          value: i.value,
          label: `${_.startCase(i.value)} (${i.count})`
        }))
      : [];
    const facetTaxonomicStatus = _.get(facets, "status")
      ? facets.status.map(s => ({
          value: s.value,
          text: `${_.startCase(s.value)} (${s.count})`
        }))
      : null;

    columns[3].filters =
      facetTaxonomicStatus ||
      taxonomicstatus.map(s => ({ value: s, text: _.startCase(s) }));
    columns[3].filteredValue = _.get(filteredInfo, "status") || null;
    columns[10].filters =
      facetRanks || rank.map(s => ({ value: s, text: _.startCase(s) }));
    columns[10].filteredValue = _.get(filteredInfo, "rank") || null;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      columnWidth: "30px"
    };
    const hasSelected =  selectedRowKeys && selectedRowKeys.length > 0 && decision;
    return (
      <div
        style={{
          background: "#fff",
          padding: 24,
          margin: "16px 0"
        }}
      >
      <Row>
          

          {error && <Alert style={{marginBottom: '10px'}} message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}
        </Row>
        <Row>
          <Col span={2}>
            {" "}
            <Button type="danger" onClick={this.resetSearch}>
              Reset all
            </Button>
          </Col>
          <Col span={12} style={{ display: "flex", flexFlow: "column" }}>
            <SearchBox
              defaultValue={_.get(params, "q")}
              onSearch={value => this.updateSearch({ q: value })}
              style={{ marginBottom: "10px", width: "100%" }}
            />
          </Col>
          <Col span={10}>




          <Select
                    placeholder="Issue"
                    value={params.issue}
                    style={{
                      width: 200,
                      marginLeft: "10px",
                      marginBottom: "10px"
                    }}
                    showSearch
                    onChange={value => this.updateSearch({ issue: value })}
                  >
                    {facetIssues.map(r => (
                      <Option key={r.value} value={r.value}>
                        {r.label}
                      </Option>
                    ))}
                  </Select>



         { /*  <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={value => this.updateSearch({ issue: value })}
              vocab={facetIssues || issue}
              label="Issues"
         /> */}
          </Col>
        </Row>
        <Row>
          <Col span={12} style={{ textAlign: "left", marginBottom: "8px" }}>
            <Select style={{ width: 200, marginRight: 10 }} onChange={this.onDecisionChange}>
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
              loading={loading}
            >
              Apply decision
            </Button>
            <span style={{ marginLeft: 8 }}>
              {hasSelected
                ? `Selected ${selectedRowKeys.length} ${
                    selectedRowKeys.length > 1 ? "taxa" : "taxon"
                  }`
                : ""}
            </span>
          </Col>
          <Col span={12} style={{ textAlign: "right", marginBottom: "8px" }}>
            {pagination &&
              !isNaN(pagination.total) &&
              `results: ${pagination.total}`}
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
            rowKey={record => _.get(record, 'usage.name.id')}
            rowSelection={rowSelection}
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
  namefield
}) => ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield });

export default withContext(mapContextToProps)(WorkBench);
