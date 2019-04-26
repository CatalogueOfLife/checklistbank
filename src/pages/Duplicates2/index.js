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
import { Resizable } from 'react-resizable';
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

const columns = [
  {
    title: "ID",
    dataIndex: "name.id",
    width: 60,
    className: "workbench-td",
    render: (text, record) => {
      return (
        <NavLink
              key={_.get(record, "id")}
              to={{
                pathname: `/dataset/${_.get(record, "name.datasetKey")}/${
                  _.get(record, "bareName") ? "name" : "taxon"
                }/${encodeURIComponent(
                   _.get(record, "name.id")
                )}`
              }}
              exact={true}
            >
          {text}
        </NavLink>
      );
    },
  
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 90,
    className: "workbench-td",

  },
  /*
  {
    title: "Uninomial",
    width: 160,
    dataIndex: "name.uninomial",
    key: "uninomial",
    className: "workbench-td",
  }, */
  {
    title: "Genus",
    width: 160,
    dataIndex: "name.genus",
    key: "genus",
    className: "workbench-td",
  },
  {
    title: "specificEpithet",
    width: 160,
    dataIndex: "name.specificEpithet",
    key: "specificEpithet",
    className: "workbench-td",
  },
  {
    title: "infraspecificEpithet",
    width: 160,
    dataIndex: "name.infraspecificEpithet",
    key: "infraspecificEpithet",
    className: "workbench-td",
  },
  {
    title: "Authorship",
    width: 240,
    dataIndex: "name.authorship",
    key: "authorship",
    className: "workbench-td",
  },

  {
    title: "Rank",
    width: 100,
    dataIndex: "name.rank",
    key: "rank",
    className: "workbench-td",
  }
];

class DuplicateSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      selectedRowKeys: [],
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

    this.setState({ params: {...params, withDecision: params.withDecision === 'true', parentDifferent: params.parentDifferent === 'true'} }, this.getData);
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
          data: res.data.map((e, i) => e.usages.map(u => ({...u.usage, dupID: i, dubKey: e.key}))).flat(), // create a falt array of all duplicate sets, use index in the original response as dupID for hold dupes together
          duplicateCount: res.data.length,
          error: null
        });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [], duplicateCount: 0,
        });
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


  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
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

  components = {
    header: {
      cell: ResizeableTitle,
    },
  };

  handleResize = index => (e, { size }) => {
    this.setState(({ columns }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return { columns: nextColumns };
    });
  };
  render() {
    const { data , loading, error, params,  selectedRowKeys, decision, postingDecisions, duplicateCount } = this.state;
    const { rank, taxonomicstatus } = this.props;
    const hasSelected = selectedRowKeys && selectedRowKeys.length > 0 && decision;
    const resizableColumns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: column => ({
        width: column.width,
        onResize: this.handleResize(index),
      }),
    }));
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
            value={ (params.status1 && params.status2) ? `${params.status1}-${params.status2}` : undefined}
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
            <Switch checked={params.parentDifferent === true} onChange={(value) => this.updateSearch({parentDifferent: value})}/>
            </FormItem>
            <FormItem  label="With decision">
            <Switch checked={params.withDecision === true} onChange={(value) => this.updateSearch({withDecision: value})} />
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
            {selectedRowKeys && selectedRowKeys.length > 0
                && 
            
               `Selected ${selectedRowKeys.length} ${
                selectedRowKeys.length > 1 ? "taxa" : "taxon"
                  }`
               
            }
            </Card>
           </Col>
          </Row>
          <Row>
 
      
        </Row>
        <Row><Col  style={{ textAlign: "right", marginBottom: "8px" }}>
        
          { data && duplicateCount > 0 && `Duplicates: ${duplicateCount}` }</Col></Row>
        {!error && (
          <Table
            size="small"
            components={this.components}
            columns={resizableColumns}
            dataSource={data}
            loading={loading}
            onChange={this.handleTableChange}
            rowKey="id"
            rowClassName={record => record.dupID % 2 ? 'duplicate-alternate-row' : ''}
            pagination={false}
            rowSelection={rowSelection}

          />
        )}
      </div>
    );
  }
}

const mapContextToProps = ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield }) => ({ rank, taxonomicstatus, issue, nomstatus, nametype, namefield });



export default withContext(mapContextToProps)(DuplicateSearchPage)
