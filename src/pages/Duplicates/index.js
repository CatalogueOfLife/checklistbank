import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Form, Table, Alert, Select, Row, Col, Button, Switch, Card, notification } from "antd";
import config from "../../config";
import qs from "query-string";
import history from "../../history";
import Classification from "../NameSearch/Classification";
import SearchBox from "../DatasetList/SearchBox";
import MultiValueFilter from "../NameSearch/MultiValueFilter";
import RowDetail from './RowDetail'
import _ from "lodash";
import withContext from '../../components/hoc/withContext'
import BooleanValue from '../../components/BooleanValue'
const { Option, OptGroup } = Select;
const FormItem = Form.Item;

const columns = [

  {
    title: "Status",
    key: "statusDifferent",
    filters: [{text: "accepted - accepted", value: "accepted - accepted"},{text: "accepted - synonym", value: "accepted - synonym"}],
    render: (text, record) => {
      return `${record.usage1.status} - ${record.usage2.status}`
      
    }
  },
  {
    title: "Authors different",
    key: "authorsDifferent",
    render: (text, record) => {
      return <BooleanValue value={record.usage1.name.authorship !== record.usage2.name.authorship}/>
      
    }
  },
  {
    title: "Parent different",
    key: "parentDifferent",
    render: (text, record) => {
      return <BooleanValue value={record.usage1.parentId !== record.usage2.parentId}/>
      
    }
  },
  {
    title: "Rank",
    key: "rank",

    render: (text, record) => {
      return `${record.usage1.name.rank} - ${record.usage2.name.rank}`
      
    }
  }
];

class DuplicateSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      selectedRowKeys: {},
      columns: columns,
      params: {},
      loading: false,
      postingDecisions: false,
      decision: null,
      expandedRowKeys: []
    };
  }

  componentWillMount() {
    const { datasetKey } = this.props;
    let params = qs.parse(_.get(this.props, "location.search"));
   /* if (_.isEmpty(params)) {
      history.push({
        pathname: `/dataset/${datasetKey}/duplicates`,
        search: `?limit=50&offset=0`
      });
    } */

    this.setState({ params }, this.getData);
  }

  getData = () => {
    const { params } = this.state;
    this.setState({ loading: true });
    const { datasetKey } = this.props;
  
    history.push({
      pathname: `/dataset/${datasetKey}/duplicates`,
      search: `?${qs.stringify(params)}`
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify(
        params
      )}`
    )
      .then(res => {
        
        this.setState({
          loading: false,
          data: res.data,
          expandedRowKeys: res.data.map(record => `${record.usage1.id} ${record.usage2.id}`),
          error: null
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    
    let query = _.merge(this.state.params, {
      ...filters
    });


    this.setState({ params: query }, this.getData);
  };

  updateSearch = params => {
    _.forEach(params, (v, k) => {
      this.state.params[k] = v;
    });
    this.setState({ ...this.state.params }, this.getData);
  };

  resetSearch = () => {
    this.setState({ params: {} }, this.getData);
  };

  toggleAdvancedFilters = () => {
    this.setState({advancedFilters: !this.state.advancedFilters})
  };

  onSelectChange = (selectedRowKeys, index )=> {
    const rowKeys = {...this.state.selectedRowKeys, [index]: selectedRowKeys}

    this.setState({ selectedRowKeys: rowKeys, selectedKeysForDecision: Object.values(rowKeys).flat() });
  };
  onDecisionChange = decision => {
    this.setState({ decision });
  };
  applyDecision = () => {
    const {selectedKeysForDecision, data, decision} = this.state;
    const { datasetKey } = this.props;
    this.setState({postingDecisions: true})
   const promises = data.map(d => [d.usage1, d.usage2]).flat()
      .filter(d => selectedKeysForDecision.includes(_.get(d, 'id')))
      .map(d => {
       return axios.post(
          `${config.dataApi}decision`, {
            datasetKey: datasetKey,
            subject: {
              id: _.get(d, 'name.id'),
              
              name: _.get(d, 'name.scientificName'),
              authorship: _.get(d, 'name.authorship'),
              rank: _.get(d, 'name.rank')
            },
            mode: ['block','chresonym'].includes(decision) ? decision : 'update',
            status: ['block','chresonym'].includes(decision) ? _.get(d, 'status') : decision

          }
        )
        
          .then(res => {
            const statusMsg = `Status changed to ${decision} for ${_.get(d, 'name.scientificName')}`
            const decisionMsg = `${_.get(d, 'name.scientificName')} was ${decision === 'block' ? 'blocked from the assembly' : ''}${decision === 'chresonym' ? 'marked as chresonym': ''}`

            notification.open({
              message: "Decision applied",
              description: ['block','chresonym'].includes(decision) ? decisionMsg : statusMsg
            });
            
          })
          .catch(err => {
            notification.error({
              message: "Error",
              description: err.message
            });
          });
          
      })

      return Promise.all(promises)
      .then(res => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: {},
          decision: null,
          postingDecisions: false,
          decisionError: null
        });
      })
      .catch(err => {
        this.setState({
          data: this.state.data,
          selectedRowKeys: {},
          decision: null,
          postingDecisions: false,
          decisionError: err
        });
      });

  }
  onExpand = (expanded, record) => {
    if(expanded){
      this.setState({expandedRowKeys: [...this.state.expandedRowKeys, `${record.usage1.id} ${record.usage2.id}`]})
    } else {
      this.setState({expandedRowKeys: this.state.expandedRowKeys.filter(k => k !== `${record.usage1.id} ${record.usage2.id}`)})

    }
  }
  render() {
    const { data , loading, error, params, selectedKeysForDecision, selectedRowKeys, decision, postingDecisions } = this.state;
    const { rank, taxonomicstatus } = this.props;
    const hasSelected = selectedKeysForDecision && selectedKeysForDecision.length > 0 && decision;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
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
          

          {error && <Alert message={error.message} type="error" />}
        </Row>
        <Row gutter={16}>
        <Col span={18} >
        <Card  >
        <Form layout="inline" >
          <Select placeholder="Mode" value={params.mode} style={{ width: 200, marginRight: 10 }} onChange={(value) => this.updateSearch({mode: value})}>
          <Option value="CANONICAL_WITH_AUTHORS">CANONICAL_WITH_AUTHORS</Option>
          <Option value="CANONICAL">CANONICAL</Option>
          <Option value="NAMES_INDEX">NAMES_INDEX</Option>
          </Select>


            <Select 
            placeholder="Rank"
            value={params.rank}
            style={{ width: 200, marginRight: 10  }}
            showSearch
            onChange={(value) => this.updateSearch({rank: value})}
            >
              {rank.map(r => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>

            <Select 
            placeholder="Status"
            value={`${params.status1}-${params.status2}`}
            style={{ width: 200, marginRight: 10  }}
            showSearch
            onChange={(value) => {
              const statuses = value.split('-');
              this.updateSearch({status1: statuses[0], status2: statuses[1]})}
            }
            >
              
                <Option  value="accepted-accepted">
                accepted - accepted
                </Option>
                <Option  value="accepted-synonym">
                accepted - synonym
                </Option>
                <Option  value="synonym-synonym">
                synonym - synonym
                </Option>
              
            </Select>

            <FormItem label="Parent different">
            <Switch checked={Boolean(params.parentDifferent)} onChange={(value) => this.updateSearch({parentDifferent: value})}/>
            </FormItem>
            <FormItem  label="With decision">
            <Switch checked={Boolean(params.withDecision)} onChange={(value) => this.updateSearch({withDecision: value})} />
            </FormItem>
            <FormItem>
            <Button type="danger" onClick={this.resetSearch}>
                Reset all
              </Button>
            </FormItem>
            </Form>
            </Card>
          </Col>
          <Col span={6} >
          <Card >
       
            <Select style={{ width: 140, marginRight: 10  }} onChange={this.onDecisionChange} placeholder="Pick decision">
            
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
              style={{ width: 140, marginRight: 10  }}
              loading={postingDecisions}
            >
              Apply decision
            </Button>
            {selectedKeysForDecision && selectedKeysForDecision.length > 0
                && 
            
               `Selected ${selectedKeysForDecision.length} ${
                  selectedKeysForDecision.length > 1 ? "taxa" : "taxon"
                  }`
               
            }
            </Card>
           </Col>
          </Row>
          <Row>
 
      
        </Row>
        <Row><Col  style={{ textAlign: "right", marginBottom: "8px" }}>
        <Button style={{ marginRight: 10  }} onClick={() => this.setState({expandedRowKeys: []})}>
                Collapse all rows
              </Button>
          { data && data.length > 0 && `results: ${data.length}` }</Col></Row>
        {!error && (
          <Table
            size="small"
            onExpand={this.onExpand}
            expandedRowKeys={this.state.expandedRowKeys}
            columns={this.state.columns}
            dataSource={data}
            loading={loading}
            onChange={this.handleTableChange}
            rowKey={record => `${record.usage1.id} ${record.usage2.id}`}
            expandedRowRender={record => <RowDetail data={record} selectedRowKeys={selectedRowKeys[`${record.usage1.id} ${record.usage2.id}`] || []} onSelectChange={this.onSelectChange} index={`${record.usage1.id} ${record.usage2.id}`}></RowDetail>}
          />
        )}
      </div>
    );
  }
}

const mapContextToProps = ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield }) => ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield });



export default withContext(mapContextToProps)(DuplicateSearchPage)
