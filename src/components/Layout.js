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
        width: '150px',
        height: '31px',
        margin: '0px 30px 0px 0',
        float: 'left'
    }
}


class AppLayout extends Component {
    constructor(props) {
        super(props);
       
    
      }

    render() {

        const { children, selectedMenuItem, selectedDataset, selectedTaxon, section } = this.props;
      
        console.log(section)
       
        return (
            <Layout className="layout" style={{height:"100vh"}}>
                <Header>

                    <div style={classes.logo} >
                        <img src="/col-logo-trans.png" style={{ height: '60px' }} alt=""></img>
                    </div>


                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={[selectedMenuItem]}
                        style={{ lineHeight: '64px' }}
                    >
                    <Menu.Item key="managementclassification"><NavLink to={{ pathname: '/managementclassification' }}>
                                Management classification
                                    </NavLink></Menu.Item>
                  
                        <Menu.Item key="dataset">
                            <NavLink to={{ pathname: '/dataset' }}>
                                All datasets
                </NavLink>

                        </Menu.Item>
                        <Menu.Item key="datasetCreate">
                            <NavLink to={{ pathname: '/dataset/create' }}>
                            Register new dataset
                </NavLink>

                        </Menu.Item>
                    </Menu>

                </Header>
                <Layout>
                    <Sider width={230} style={{ background: '#fff' }}>
                        <Menu
                            mode="inline"
                            defaultOpenKeys={['dataset']}
                            defaultSelectedKeys={[selectedMenuItem]}
                            style={{ height: '100%', borderRight: 0 }}
                        >   
                         <Menu.Item key="managementclassification"><NavLink to={{ pathname: '/managementclassification' }}>
                                Management classification
                                    </NavLink></Menu.Item>
                            <SubMenu key="dataset" title={<span><Icon type="file-text" />Dataset</span>}>
                                <Menu.Item key="dataset"><NavLink to={{ pathname: '/dataset' }}>
                                All datasets
                                    </NavLink></Menu.Item>
                                <Menu.Item key="datasetCreate"><NavLink to={{ pathname: '/dataset/create' }}>
                                    Register new dataset
                                    </NavLink></Menu.Item>

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
