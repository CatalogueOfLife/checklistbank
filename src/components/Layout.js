import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";

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
    render() {
        const { children } = this.props;
        const { selectedMenuItem } = this.props;
        const { selectedDataset, selectedTaxon } = this.props;
        return (
            <Layout className="layout">
                <Header>

                    <div style={classes.logo} >
                        <img src="/col-logo-trans.png" style={{ height: '60px' }}></img>
                    </div>


                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={[selectedMenuItem]}
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

                    </Menu>

                </Header>
                <Layout>
                    <Sider width={200} style={{ background: '#fff' }}>
                        <Menu
                            mode="inline"
                            defaultSelectedKeys={['1']}
                            defaultOpenKeys={['sub1']}
                            style={{ height: '100%', borderRight: 0 }}
                        >
                            <SubMenu key="sub1" title={<span><Icon type="user" />subnav 1</span>}>
                                <Menu.Item key="1">option1</Menu.Item>
                                <Menu.Item key="2">option2</Menu.Item>
                                <Menu.Item key="3">option3</Menu.Item>
                                <Menu.Item key="4">option4</Menu.Item>
                            </SubMenu>
                            <SubMenu key="sub2" title={<span><Icon type="laptop" />subnav 2</span>}>
                                <Menu.Item key="5">option5</Menu.Item>
                                <Menu.Item key="6">option6</Menu.Item>
                                <Menu.Item key="7">option7</Menu.Item>
                                <Menu.Item key="8">option8</Menu.Item>
                            </SubMenu>
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
