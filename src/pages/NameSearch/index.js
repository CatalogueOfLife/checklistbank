import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert , Tag, Row, Col, Button} from "antd";
import config from "../../config";
import qs from "query-string";
import history from '../../history'

import SearchBox from '../DatasetList/SearchBox';
import MultiValueFilter from './MultiValueFilter';

import _ from 'lodash'




const columns = [
  {
    title: "Scientific Name",
    dataIndex: "usage.name.scientificName",
    key: "scientificName",
    render: (text, record) => {
      return (
        <NavLink to={{ pathname: `/dataset/${_.get(record, 'usage.name.datasetKey')}/name/${encodeURIComponent(_.get(record, 'usage.name.id'))}` }} exact={true}>
          {text}
        </NavLink>
      );
    },
    width: 200,
    sorter: true
  },
  {
    title: "Authorship",
    dataIndex: "usage.name.authorship",
    key: "authorship",
    width: 150
  },
  {
    title: "Status",
    dataIndex: "usage.status",
    key: "status",
    width: 60,
  },
  {
    title: "Rank",
    dataIndex: "usage.name.rank",
    key: "rank",
    width: 60,
    sorter: true
  },
  {
    title: "Issues",
    dataIndex: "issues",
    key: "issues",
    width: 400,
    render: (text, record) => {
        return (
          record.issues ? record.issues.map(i => <Tag key={i} color="red">{i}</Tag>) : ''
        );
      },

  }

];




class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    this.state = {
      data: [],
      columns: columns,
      params: {},
      pagination: {
        pageSize: 50,
        current: 1
      },
      loading: false
    };
  }
  

  componentWillMount() {
    const {datasetKey} = this.props; 
    let params = qs.parse(_.get(this.props, 'location.search'));
    console.log(this.props)
    if(_.isEmpty(params)){
        params = {limit: 50, offset: 0}
      history.push({
        pathname: `/dataset/${datasetKey}/names`,
        search: `?limit=50&offset=0`
      })
    }

    this.setState({params}, this.getData)
  }


  getData = () => {
     const {params} = this.state; 
    this.setState({ loading: true });
    const {datasetKey} = this.props; 
    if(!params.q){
      delete params.q
    }
    history.push({
    pathname: `/dataset/${datasetKey}/names`,
      search: `?${qs.stringify(params)}`
    })
    axios(`${config.dataApi}dataset/${datasetKey}/name/search?${qs.stringify(params)}`)
      .then(res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.data.total;

        this.setState({
          loading: false,
          data: res.data.result,
          err: null,
          pagination
        }); 

      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    
    this.setState({
      pagination: pager
    });
    let query = _.merge(this.state.params, {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters
    })

    if(sorter && sorter.field) {
      let split =   sorter.field.split('.');

      if(split[split.length-1] === 'scientificName'){
        query.sortBy = 'name'
      } else if(split[split.length-1] === 'rank'){
        query.sortBy = 'taxonomic'
      } else {
        query.sortBy = split[split.length-1]
      }


    }
    if(sorter && sorter.order === 'descend'){
      query.reverse = true
    } else {
      query.reverse = false
    }
    this.setState({params: query}, this.getData);
  }

  updateSearch = (params) => {
    _.forEach(params, (v, k) => {
        this.state.params[k] = v
    })
    this.setState({...this.state.params}, this.getData)
  }

  resetSearch = () => {
    this.setState({params: {limit: 50, offset: 0}}, this.getData)
  }
  render() {
    const { data, loading, error, params } = this.state;

    return (
      <div style={{ background: '#fff', padding: 24, minHeight: 280, margin: '16px 0' }}>
      <Row >
          <Col span={12} style={{  display: 'flex',   flexFlow: 'column', height: '165px'}}>
        <SearchBox
        defaultValue={_.get(params, 'q')}
        onSearch={value => this.updateSearch({ q: value})}
        style={{ marginBottom: "10px", width: "100%" }}
        >
        </SearchBox>
        <div style={{flex: 1, overflow: 'auto'}}></div>
        <div>
        <Button type="danger" onClick={this.resetSearch}>Reset all</Button>
        </div>
        
       
        
        </Col>
        <Col span={12}>
        <MultiValueFilter defaultValue={_.get(params, 'issue')} onChange={value => this.updateSearch({ issue: value})} vocab="issue" label="Issues"></MultiValueFilter>

        <MultiValueFilter defaultValue={_.get(params, 'rank')} onChange={value => this.updateSearch({ rank: value})} vocab="rank" label="Ranks"></MultiValueFilter>
        <MultiValueFilter defaultValue={_.get(params, 'status')} onChange={value => this.updateSearch({ status: value})} vocab="taxonomicstatus" label="Status"></MultiValueFilter>

        
        </Col>
        {error && <Alert message={error.message} type="error" />}
        </Row>
        {!error && (
        <Table
            size="middle"
            columns={this.state.columns}
            dataSource={data}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
            rowKey="usage.name.id"
          />
         
        )}
      </div>
    );
  }
}

export default NameSearchPage;
