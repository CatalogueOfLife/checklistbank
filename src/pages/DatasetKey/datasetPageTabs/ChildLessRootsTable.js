import React from "react";

import { Table, Tag } from "antd";
import { NavLink } from "react-router-dom";



class ChildLessRootsTable extends React.Component {
    constructor(props) {
        super(props);
        const { datasetKey } = this.props;
        this.state = {
            columns: [
                {
                    title: "Rank",
                    dataIndex: "rank",
                    key: "rank",
                    width: 250
                },
                {
                    title: "Name",
                    dataIndex: "name",
                    key: "name",
                    render: (text, record) => {
                        return (
                            <NavLink to={{ pathname: `/dataset/${datasetKey}/taxon/${record.id}` }} exact={true}>
                                <span dangerouslySetInnerHTML={{__html: text}}></span>
                            </NavLink>
                        );
                    },
                },

                {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (status) => { return (status === 'accepted') ? <Tag color="blue" key={status}>{status}</Tag> : <Tag color="red" key={status}>{status}</Tag> }
                }
            ]


        }
    }
    render = () => {
        const { data } = this.props;
        const { columns } = this.state;
        return (<div style={{ marginTop: '10px' }}>
            <h3>Childless taxa</h3>
            <Table 
            scroll={{x: 2000}}
            size="small"
            columns={columns}
            rowKey="id"
                dataSource={data}></Table>
        </div>)
    }


}

export default ChildLessRootsTable