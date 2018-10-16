import React from 'react';
import { Menu, Icon } from 'antd';
import { NavLink } from "react-router-dom";


class DatasetTabs extends React.Component {


    render() {
        return (
            <Menu
                selectedKeys={[this.props.selectedItem]}
                mode="horizontal"
            >
                <Menu.Item key="meta">
                    <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/meta` }}>
                        View/Edit Meta Data                                    </NavLink>
                </Menu.Item>
                <Menu.Item key="classification" >
                    <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/classification` }}>
                        Classification
                                    </NavLink>
                </Menu.Item>
                <Menu.Item key="names" >
                    <NavLink to={{ pathname: `/dataset/${this.props.datasetKey}/names` }}>
                        Search names
                                    </NavLink>
                </Menu.Item>

            </Menu>
        );
    }
}

export default DatasetTabs;