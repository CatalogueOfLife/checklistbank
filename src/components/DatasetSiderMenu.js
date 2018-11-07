import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import _ from 'lodash'
import { Menu, Layout } from 'antd';
const { Sider } = Layout;
const MenuItemGroup = Menu.ItemGroup;


class DatasetSiderMenu extends Component {



    render() {

        const { selectedDataset, selectedTaxon, defaultSelected, selectedName } = this.props;
        return (

            <Sider width={230} style={{ background: '#fff' }}>
                <Menu
                    mode="inline"
                    selectedKeys={[defaultSelected]}
                    style={{ height: '100%', borderRight: 0 }}
                >
                    <MenuItemGroup key="datasetKey" title={`Dataset ID: ${selectedDataset.key}`}>
                    <Menu.Item key="issues">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/issues` }}>
                                Issues
                                    </NavLink>
                        </Menu.Item>
                        <Menu.Item key="metrics">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/metrics` }}>
                                Import Metrics
                                    </NavLink>
                        </Menu.Item>
                        <Menu.Item key="meta">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/meta` }}>
                                Metadata
                                    </NavLink>
                        </Menu.Item>
                        <Menu.Item key="sources">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/sources` }}>
                                CoL Sources
                                    </NavLink>
                        </Menu.Item>
                        <Menu.Item key="classification">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/classification` }}>
                                Classification
                                    </NavLink>
                        </Menu.Item>
                        <Menu.Item key="names">
                            <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/names` }}>
                                Names
                                    </NavLink>
                        </Menu.Item>
                        {selectedTaxon && <Menu.Item key="taxon" >
                            Taxon ID: {selectedTaxon.id}
                        </Menu.Item>}
                        {selectedName && <Menu.Item key="name" >
                            Name ID: {selectedName.id}
                        </Menu.Item>}
                    </MenuItemGroup>
                </Menu>
            </Sider>

        );
    }
}



export default DatasetSiderMenu;
