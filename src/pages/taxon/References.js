import React from 'react';
import { Table } from 'antd';
import _ from 'lodash';



const columns = [{
    title: 'citation',
    dataIndex: 'citation',
    key: 'citation'
}
];



class ReferencesTable extends React.Component {


    componentWillMount() {
        let references = _.values(this.props.data)
        this.setState({references})
    }

    render() {

        const { references } = this.state;
        return (
            <Table columns={columns} dataSource={references} rowKey="verbatimKey" pagination={false} size="small" showHeader={false} />
        );
    }
}



export default ReferencesTable;
