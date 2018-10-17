import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";
import _ from 'lodash'
import '../App.css';


import { Layout, Menu, Breadcrumb, Icon } from 'antd';
const { SubMenu } = Menu;

const { Header, Content, Footer, Sider } = Layout;

const classes = {
    logo: {
        width: '120px',
        height: '31px',
        margin: '0px 24px 0px 0',
        float: 'left'
    }
}


class AppLayout extends Component {
    constructor(props) {
        super(props);
        
      }

    render() {

        const { children, selectedMenuItem, selectedDataset, selectedTaxon, section } = this.props;
       const defaultSelected = (selectedDataset) ? [section] : [selectedMenuItem]
        return (
            <Layout className="layout">
                <Header>

                    <div style={classes.logo} >
                        <img src="/col-logo-trans.png" style={{ height: '60px' }}></img>
                    </div>


                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultOpenKeys={[selectedMenuItem]}
                        selectedKeys={[selectedMenuItem]}
                        style={{ lineHeight: '64px' }}
                    >
                        <Menu.Item key="home" >
                            <NavLink to={{ pathname: '/' }}>
                                Home
                </NavLink>
                        </Menu.Item>
                        <Menu.Item key="dataset">
                            <NavLink to={{ pathname: '/dataset' }}>
                                Dataset
                </NavLink>

                        </Menu.Item>
                        <Menu.Item key="datasetCreate">
                            <NavLink to={{ pathname: '/dataset/create' }}>
                                New dataset
                </NavLink>

                        </Menu.Item>
                    </Menu>

                </Header>
                <Layout>
                    <Sider width={200} style={{ background: '#fff' }}>
                        <Menu
                            mode="inline"
                            defaultOpenKeys={[selectedMenuItem]}
                            defaultSelectedKeys={defaultSelected}
                            style={{ height: '100%', borderRight: 0 }}
                        >
                            <SubMenu key="dataset" title={<span><Icon type="user" />Dataset</span>}>
                                <Menu.Item key="dataset"><NavLink to={{ pathname: '/dataset' }}>
                                    Show all
                                    </NavLink></Menu.Item>
                                <Menu.Item key="datasetCreate"><NavLink to={{ pathname: '/dataset/create' }}>
                                    Import new dataset
                                    </NavLink></Menu.Item>

                            </SubMenu>

                            {selectedMenuItem === 'datasetKey' && this.props.selectedDataset &&
                                <SubMenu  key="datasetKey" title={<span><Icon type="laptop" />Dataset ID: {_.get(this.props, 'selectedDataset.key')}</span>}>
                                    <Menu.Item key="meta">
                                        <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/meta` }}>
                                            Meta data
                                    </NavLink>
                                    </Menu.Item>
                                    <Menu.Item key="sources">
                                        <NavLink to={{ pathname: `/dataset/${_.get(this.props, 'selectedDataset.key')}/sources` }}>
                                            Col Sources
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
                                </SubMenu>}
                            <SubMenu key="sub3" title={<span><Icon type="notification" />subnav 3</span>}>
                                <Menu.Item key="9">option9</Menu.Item>
                                <Menu.Item key="10">option10</Menu.Item>
                                <Menu.Item key="11">option11</Menu.Item>
                                <Menu.Item key="12">option12</Menu.Item>
                            </SubMenu>
                        </Menu>
                    </Sider>
                    <Content style={{ padding: '0 50px' }}>
                        {selectedDataset &&
                            <Breadcrumb style={{ margin: '16px 0' }}>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/' }}>
                                        Home
                                    </NavLink>
                                </Breadcrumb.Item>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset' }}>
                                        dataset
                                    </NavLink>
                                </Breadcrumb.Item>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset/' + selectedDataset.key + '/meta' }}>
                                        {selectedDataset.title}
                                    </NavLink>
                                </Breadcrumb.Item>

                                {selectedTaxon && <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset/' + selectedDataset.key + '/taxon/' + selectedTaxon.id }}>
                                        {selectedTaxon.name.scientificName}
                                    </NavLink>
                                </Breadcrumb.Item>}
                            </Breadcrumb>}
                        <div style={{ background: '#fff', padding: 24, minHeight: 280, margin: '16px 0' }}>
                            {children}
                        </div>
                    </Content>

                </Layout>
                <Footer style={{ textAlign: 'center' }}>
                    Catalogue of Life ©2018
    </Footer>
            </Layout>
        );
    }
}



export default AppLayout;
