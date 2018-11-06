import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import _ from 'lodash'
import '../App.css';
import DatasetSiderMenu from './DatasetSiderMenu'

import { Layout, Menu, Breadcrumb, Icon } from 'antd';
import Auth from './Auth/Auth';
import history from '../history'
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
    componentWillMount = () => {
        const { selectedMenuItem, selectedDataset, section } = this.props;
        const defaultSelected = (selectedDataset) ? section : [selectedMenuItem]

        this.setState({ defaultSelected, isAuthenticated: Auth.isAuthenticated })
        Auth.on('login', ()=>{
            this.setState({isAuthenticated: Auth.isAuthenticated})
        })
        Auth.on('logout', ()=>{
            this.setState({isAuthenticated: Auth.isAuthenticated})
        })
    }
    componentWillReceiveProps = (nextProps) => {
        const { selectedMenuItem, selectedDataset, section } = nextProps;
        if (section !== this.props.section || selectedMenuItem !== this.props.selectedMenuItem) {
            const defaultSelected = (selectedDataset) ? [section] : [selectedMenuItem]
            this.setState({ defaultSelected })
        }
    }
    render() {

        const { children, selectedMenuItem, selectedDataset, selectedTaxon, selectedName, section } = this.props;
        const { isAuthenticated } = this.state;
        return (
            <Layout className="layout" style={{ height: "100vh" }}>
                <Header>

                    <div style={classes.logo} >
                        <img src="/col-logo-trans.png" style={{ height: '60px' }} alt=""></img>
                    </div>


                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultOpenKeys={[selectedMenuItem]}
                        selectedKeys={[selectedMenuItem]}
                        style={{ lineHeight: '64px' }}
                    >
                        <Menu.Item key="home"><NavLink to={{ pathname: '/imports/running' }}>
                        Home
                                    </NavLink></Menu.Item>
                        <Menu.Item key="managementclassification"><NavLink to={{ pathname: '/assembly' }}>
                        CoL Assembly
                                    </NavLink></Menu.Item>
                        <Menu.Item key="dataset">
                            <NavLink to={{ pathname: '/dataset' }}>
                                Datasets
                </NavLink>

                        </Menu.Item>
                        <Menu.Item key="datasetCreate">
                            <NavLink to={{ pathname: '/dataset/create' }}>
                                New Dataset
                </NavLink>

                        </Menu.Item>
                  { !isAuthenticated &&  <Menu.Item key="login" style={{float: 'right'}}>
                            <NavLink to={{ pathname: '/user/login' }}>
                             <Icon type='login'></Icon> Login
                </NavLink>

                        </Menu.Item>}
                        { isAuthenticated &&  <Menu.Item key="logout" style={{float: 'right'}} 
    
                            onClick={() => { 
                                Auth.signout()
                                history.push('/')
                            }
                                
                                }>
                             <Icon type='logout'></Icon> Logout

                        </Menu.Item>}
                    </Menu>

                </Header>
                <Layout>
                    {selectedMenuItem === 'datasetKey' && this.props.selectedDataset && (this.props.section || selectedTaxon) &&
                    <DatasetSiderMenu defaultSelected={this.props.section} selectedDataset={this.props.selectedDataset} selectedTaxon={selectedTaxon} selectedName={selectedName}></DatasetSiderMenu>}
                    <Content style={{ padding: '0 50px', overflowY: 'scroll' }}>
                        {selectedDataset &&
                            <Breadcrumb style={{ margin: '16px 0' }}>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/' }}>
                                        Home
                                    </NavLink>
                                </Breadcrumb.Item>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset' }}>
                                        Dataset
                                    </NavLink>
                                </Breadcrumb.Item>
                                <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset/' + selectedDataset.key + '/meta' }}>
                                        {selectedDataset.title}
                                    </NavLink>
                                </Breadcrumb.Item>

                                {selectedTaxon && <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset/' + selectedDataset.key + '/taxon/' + selectedTaxon.id }}>
                                        Taxon: {selectedTaxon.name.scientificName}
                                    </NavLink>
                                </Breadcrumb.Item>}
                                {selectedName && <Breadcrumb.Item>
                                    <NavLink to={{ pathname: '/dataset/' + selectedDataset.key + '/name/' + selectedName.id }}>
                                        Name: {selectedName.scientificName}
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
