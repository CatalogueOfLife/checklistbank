import React from 'react';
import { Table } from 'antd';
import _ from 'lodash';
import { NavLink } from "react-router-dom";



const columns = [{
    title: 'rank',
    dataIndex: 'rank',
    key: 'rank'
},
{
    title: 'scientificName',
    dataIndex: 'scientificName',
    key: 'scientificName',
    render: (text, record) => {return <NavLink to={{ pathname: `/dataset/${record.datasetKey}/classification`, search: `?taxonKey=${record.taxonKey}` }}  >{text}</NavLink>},

}
];


class ClassificationTable extends React.Component {
    
    componentWillMount() {
        const {datasetKey} = this.props;
        let classification = _.map(_.reverse(this.props.data), (t)=>{
            return {
                scientificName: t.name.scientificName,
                rank: t.name.rank,
                taxonKey: t.id,
                datasetKey: datasetKey
            }
        });
        
        this.setState({classification})
    }
    render() {
        
        const { classification } = this.state;
        return (
            <Table columns={columns} dataSource={classification} rowKey="taxonKey" pagination={false} size="small"  showHeader={false}/>
        );
    }
}



export default ClassificationTable;
