import React from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Table, Divider, Tag } from 'antd';
import config from '../config';
import qs from 'query-string';
const _ = require('lodash')

const columns = [{
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    render: (text, record) => <NavLink to={{ pathname: `/dataset/${record.key}` }} exact={true} >{text}</NavLink>,
}, {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
},
{
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
},
{
    title: 'ImportFrequency',
    dataIndex: 'importFrequency',
    key: 'importFrequency',
}
  /*, {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
    render: tags => (
      <span>
        {tags.map(tag => <Tag color="blue" key={tag}>{tag}</Tag>)}
      </span>
    ),
  }, {
    title: 'Action',
    key: 'action',
    render: (text, record) => (
      <span>
        <a href="javascript:;">Invite {record.name}</a>
        <Divider type="vertical" />
        <a href="javascript:;">Delete</a>
      </span>
    ),
  } */];

/* const data = [{
   key: '1',
   name: 'John Brown',
   age: 32,
   address: 'New York No. 1 Lake Park',
   tags: ['nice', 'developer'],
 }, {
   key: '2',
   name: 'Jim Green',
   age: 42,
   address: 'London No. 1 Lake Park',
   tags: ['loser'],
 }, {
   key: '3',
   name: 'Joe Black',
   age: 32,
   address: 'Sidney No. 1 Lake Park',
   tags: ['cool', 'teacher'],
 }]; */



class DatasetList extends React.Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
        this.state = {
            data: [],
            pagination: {
                pageSize: 100,
                current: 1
            },
            loading: false,
        };
    }


    componentWillMount() {
        this.getData({ limit: 100, offset: 0 })
    }

    getData = (params = {}) => {

        this.setState({ loading: true });
        axios(`${config.dataApi}dataset?${qs.stringify(params)}`)
            .then((res) => {
                const pagination = { ...this.state.pagination };
                pagination.total = res.data.total;

                this.setState({ loading: false, data: res.data.result, err: null, pagination })
            })
            .catch((err) => {
                this.setState({ loading: false, error: err, data: [] })
            })
    }
    handleTableChange = (pagination, filters) => {
        const pager = { ...this.state.pagination };
        pager.current = pagination.current;

        this.setState({
            pagination: pager,
        });
        this.getData({
            limit: pager.pageSize,
            offset: (pager.current - 1) * pager.pageSize,
            ...filters,
        });
    }

    render() {

        const { data, loading } = this.state;
        return (
            <Table columns={columns} dataSource={data} loading={loading} pagination={this.state.pagination} onChange={this.handleTableChange} />
        );
    }
}



export default DatasetList;