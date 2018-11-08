import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form , Tag} from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/Layout";
import moment from 'moment'
import history from '../../history'

import SearchBox from '../datasetList/SearchBox';
//import ColumnFilter from './ColumnFilter';



const _ = require("lodash");

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
    width: 150,
    sorter: true
  },
  {
    title: "Status",
    dataIndex: "usage.status",
    key: "status",
    filters: [{
        text: 'accepted',
        value: 'accepted',
      }, {
        text: 'doubtful',
        value: 'doubtful',
      }, {
        text: 'synonym',
        value: 'synonym',
      }, {
        text: 'ambiguous synonym',
        value: 'ambiguous synonym',
      }, {
        text: 'misapplied',
        value: 'misapplied',
      }],
    width: 60,
  },
  {
    title: "Rank",
    dataIndex: "usage.name.rank",
    key: "rank",
    width: 60,
  },
  {
    title: "Issues",
    dataIndex: "issues",
    key: "issues",
    width: 400,
    render: (text, record) => {
        return (
          _.map(record.issues, (i)=>{
              return <Tag key={i} color="red">{i}</Tag>
          })
        );
      },

  }

];




class NameSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.handleColumns = this.handleColumns.bind(this);

    this.state = {
      data: [],
      columns: columns,
      search: _.get(this.props, 'location.search.q') || '',
      pagination: {
        pageSize: 150,
        current: 1
      },
      loading: false
    };
  }
  

  componentWillMount() {
    const {datasetKey} = this.props; 
    let query = qs.parse(_.get(this.props, 'location.search'));
    console.log(this.props)
    if(_.isEmpty(query)){
      query = {limit: 150, offset: 0}
      history.push({
        pathname: `/dataset/${datasetKey}/names`,
        search: `?limit=150&offset=0`
      })
    }

    this.getData(query || {limit: 150, offset: 0});
  }

  componentDidMount() {
    this.handleColumns(columns)
  }



  getData = (params = { limit: 150, offset: 0 }) => {
    this.setState({ loading: true, params });
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

    if(sorter) {
      query.sortBy =  sorter.field
    }
    if(sorter && sorter.order === 'descend'){
      query.reverse = true
    } else {
      query.reverse = false
    }
    this.getData(query);
  }

  handleColumns = (columns)=> {
   
    this.setState({columns})
  }
  
  render() {
    const { data, loading, error } = this.state;

    return (
      <div>
      <div>
        <SearchBox
        defaultValue={_.get(this.state, 'params.q')}
        onSearch={value => this.getData({ q: value, limit: 150, offset: 0 })}
        >
        
        </SearchBox>

        {error && <Alert message={error.message} type="error" />}
        </div>
        {!error && (
        <Table
            size="middle"
            columns={this.state.columns}
            dataSource={data}
            loading={loading}
            pagination={this.state.pagination}
            onChange={this.handleTableChange}
          />
         
        )}
      </div>
    );
  }
}

export default NameSearchPage;
