import React from 'react';
import { Table } from 'antd';
import _ from 'lodash';



const columns = [{
    title: 'area',
    dataIndex: 'area',
    key: 'area'
}
];



class DistributionsTable extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {

        const { data } = this.props;
        return (
            <Table columns={columns} dataSource={data} rowKey="verbatimKey" pagination={false} size="small"  showHeader={false}/>
        );
    }
}



export default DistributionsTable;
