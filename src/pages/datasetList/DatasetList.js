import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/Layout";
import moment from 'moment'
import history from '../../history'

import SearchBox from './SearchBox';
import ColumnFilter from './ColumnFilter';

const FormItem = Form.Item;

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
    title: "Title",
    dataIndex: "title",
    key: "title",
    render: (text, record) => {
      return (
        <NavLink to={{ pathname: `/dataset/${record.key}/metrics` }} exact={true}>
          {text}
        </NavLink>
      );
    },
    width: 250,
    sorter: true
  },
  {
    title: "Authors and Editors",
    dataIndex: "authorsAndEditors",
    key: "authorsAndEditors",
    width: 250,
    sorter: true
  },
  {
    title: "Version",
    dataIndex: "version",
    key: "version",
    width: 150,
  },
  {
    title: "Code",
    dataIndex: "code",
    key: "code",
    width: 150,

  },
  {
    title: "Catalogue",
    dataIndex: "catalogue",
    key: "catalogue",
    width: 150,

  },
  {
    title: "Size",
    dataIndex: "size",
    key: "size",
    width: 150,
    sorter: true
  },
  {
    title: "Data Format",
    dataIndex: "dataFormat",
    key: "dataFormat",
    width: 150,

  },
  {
    title: "Import Frequency",
    dataIndex: "importFrequency",
    key: "importFrequency",
    width: 150,

  },
  {
    title: "Created",
    dataIndex: "created",
    key: "created",
    width: 150,
    sorter: true,
    render: (date) => {
      return moment(date).format("MMM Do YYYY");
    }
  },
  {
    title: "Modified",
    dataIndex: "modified",
    key: "modified",
    width: 150,
    sorter: true,
    render: (date) => {
      return moment(date).format("MMM Do YYYY");
    }

  }
];



class DatasetList extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);

    const excludeColumns = JSON.parse(localStorage.getItem('colplus_datasetlist_hide_columns')) || [];

    this.state = {
      data: [],
      excludeColumns: excludeColumns,
      columns: _.filter(columns, (v) => !_.includes(excludeColumns, v.key)),
      search: _.get(this.props, 'location.search.q') || '',
      pagination: {
        pageSize: 150,
        current: 1
      },
      loading: false
    };
  }
  

  componentWillMount() {
    let query = qs.parse(_.get(this.props, 'location.search'));
    if(_.isEmpty(query)){
      query = {limit: 150, offset: 0}
      history.push({
        pathname: '/dataset',
        search: `?limit=150&offset=0`
      })
    }
    this.getData(query || {limit: 150, offset: 0});
  }
 

  getData = (params = { limit: 150, offset: 0 }) => {
    this.setState({ loading: true, params });
    if(!params.q){
      delete params.q
    }
    history.push({
      pathname: '/dataset',
      search: `?${qs.stringify(params)}`
    })
    axios(`${config.dataApi}dataset?${qs.stringify(params)}`)
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
      query.sortBy = (sorter.field === 'authorsAndEditors') ? 'authors' : sorter.field
    }
    if(sorter && sorter.order === 'descend'){
      query.reverse = true
    }
    this.getData(query);
  }

  
  render() {
    const { data, loading, error } = this.state;

    return (
      <Layout selectedMenuItem="dataset">
        <SearchBox
        defaultValue={_.get(this.state, 'params.q')}
        onSearch={value => this.getData({ q: value, limit: 150, offset: 0 })}
        >
        
        </SearchBox>
       
         <FormItem
          style={{float: 'right'}}
         {...formItemLayout}
          label="Omit columns"
        >
        <ColumnFilter columns={columns} onChange={
          (columns)=> {
            this.setState({columns})
          }
          }></ColumnFilter>
        
            </FormItem>
        {error && <Alert message={error.message} type="error" />}
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
      </Layout>
    );
  }
}

export default DatasetList;
