import React from 'react';
import PropTypes from 'prop-types';
import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Table, Divider, Tag, Alert } from 'antd';
import config from '../config';
import qs from 'query-string';
import Layout from '../components/Layout'
import { Input } from 'antd';

const Search = Input.Search;

const _ = require('lodash')

const columns = [{
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
render: (text, record) => {return <NavLink to={{ pathname: `/dataset/${record.key}/meta` }} exact={true} >{text}</NavLink>},
    width: 250,
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
    title: 'Catalogue',
    dataIndex: 'catalogue',
    key: 'catalogue',
},
{
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
},
{
    title: 'dataFormat',
    dataIndex: 'dataFormat',
    key: 'dataFormat',
},
{
    title: 'ImportFrequency',
    dataIndex: 'importFrequency',
    key: 'importFrequency',
}
 ];





class DatasetList extends React.Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.state = {
            data: [],
            pagination: {
                pageSize: 100,
                current: 1
            },
            loading: false,

            q: ''
        };
    }


    componentWillMount() {
        this.getData()
    }
 
    getData = (params = { limit: 100, offset: 0 }) => {

        this.setState({ loading: true });
        const {q} = this.state;
        params.q = q;
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
    updateQuery = (evt) => {
        this.setState({ q: evt.target.value })
    }
    handleKeyDown = (event) => {
        
          if(event.keyCode === 8){
            this.setState({ q: '', pagination: {
                pageSize: 100,
                current: 1
            }  }, this.getData)
          }
        
      }
    render() {

        const { data, loading, error, q } = this.state;

        return <Layout selectedMenuItem="dataset">
            <Search
                placeholder="input search text"
                onChange={this.updateQuery}
                onKeyDown={this.handleKeyDown}
                value={q} 
                onSearch={value => this.getData({q: value, limit:100})}
                enterButton
                style={{marginBottom: '10px', width: '50%'}}
            />
            {error && <Alert message={error.message} type="error" />}
            {!error && <Table columns={columns} dataSource={data} loading={loading} pagination={this.state.pagination} onChange={this.handleTableChange} />}
        </Layout>


    }
}



export default DatasetList;