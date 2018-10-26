import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Form } from "antd";
import config from "../../config";
import qs from "query-string";
import Layout from "../../components/Layout";
import { Input, Select } from "antd";
import moment from 'moment'

const Search = Input.Search;
const Option = Select.Option;
const FormItem = Form.Item;

const _ = require("lodash");

const SORT_ORDERS = { ascend: "ASC", descend: "DESC" }
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
      pagination: {
        pageSize: 150,
        current: 1
      },
      loading: false
    };
  }

  componentWillMount() {
    this.getData();
  }

  getData = (params = { limit: 150, offset: 0 }) => {
    this.setState({ loading: true });

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
    let query = {
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
      ...filters
    }

    if(sorter) {
      query.sortBy = (sorter.field === 'authorsAndEditors') ? 'authors' : sorter.field
    }
    if(sorter && sorter.order === 'descend'){
      query.reverse = true
    }
    this.getData(query);
  }
  handleHideColumnChange = (excludeColumns) => {

    localStorage.setItem('colplus_datasetlist_hide_columns', JSON.stringify(excludeColumns))
    this.setState({excludeColumns, columns: _.filter(columns, (v) => !_.includes(excludeColumns, v.key)) })
  }
  render() {
    const { data, loading, error, columns, excludeColumns } = this.state;

    return (
      <Layout selectedMenuItem="dataset">
        <Search
          placeholder="input search text"
          onSearch={value => this.getData({ q: value, limit: 150, offset: 0 })}
          enterButton
          style={{ marginBottom: "10px", width: "50%" }}
        />
         <FormItem
          style={{float: 'right'}}
         {...formItemLayout}
          label="Omit columns"
        >
        <Select 
        style={{width: '250px'}}
        mode="multiple"
        placeholder="Please select"
        defaultValue={excludeColumns}
        onChange={this.handleHideColumnChange}
        >
              {columns.map((f) => {
                return <Option key={f.key} value={f.key}>{f.title}</Option>
              })}
            </Select>
            </FormItem>
        {error && <Alert message={error.message} type="error" />}
        {!error && (
        <Table
            size="middle"
            columns={columns}
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
