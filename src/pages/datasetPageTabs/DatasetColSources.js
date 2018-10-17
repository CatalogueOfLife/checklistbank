import React from 'react';
import axios from "axios";

import { Table,  Alert, List } from 'antd';
import config from '../../config';

import { Input } from 'antd';


const _ = require('lodash')

const columns = [{
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: 250,
}, {
    title: 'Alias',
    dataIndex: 'alias',
    key: 'alias',
},

{
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
},

{
    title: 'Coverage',
    dataIndex: 'coverage',
    key: 'coverage',
},
{
    title: 'Created',
    dataIndex: 'created',
    key: 'created',
}
 ];





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
            loading: false
        };
    }


    componentWillMount() {
        this.getData()
    }
 
    getData = () => {

        this.setState({ loading: true });
       const {datasetKey} = this.props;
        axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`)
            .then((res) => {
       
                this.setState({ loading: false, data: res.data, err: null })
            })
            .catch((err) => {
                this.setState({ loading: false, error: err, data: [] })
            })
    }
    

    render() {

        const { data, loading, error } = this.state;

        return <div>
           
            {error && <Alert message={error.message} type="error" />}
    {!error && <Table 
        expandedRowRender={record => 
            <List
                itemLayout="horizontal"
                dataSource={_.map(record, function (value, key) {
                    return { key: key, value: value };
                  })}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.key}
                      description={item.value}
                    />
                  </List.Item>
                )}
              />
            } 
        columns={columns} dataSource={data}  
        loading={loading} pagination={false} />}
        </div>


    }
}



export default DatasetList;