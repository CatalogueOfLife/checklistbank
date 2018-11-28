
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom'
import { withRouter } from 'react-router'
import injectSheet from 'react-jss';
import { Menu, Icon } from 'antd';
import Logo from './Logo'
import _ from 'lodash'

const SubMenu = Menu.SubMenu;
const styles = {
  
};

class BasicMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedKeys: [],
      openKeys: []
    };
  }

  componentDidMount = () => {
    const {selectedKeys, openKeys} = this.props;
    this.setState({selectedKeys, openKeys})
  }

  componentWillReceiveProps = (nextProps) =>{
    const {selectedKeys, openKeys} = nextProps;

    this.setState({selectedKeys, openKeys})
  }
  onOpenChange = (openKeys) =>{
    this.setState({openKeys})
  }
  onSelect = ({ item, key, selectedKeys }) =>{
    this.setState({selectedKeys})
  }
  render() {
    const {location, selectedDataset, selectedTaxon, selectedName} = this.props;
    const {selectedKeys, openKeys} = this.state;
    return (
      <React.Fragment>
        <div className="logo">
          <a href="/">
            <Logo />
          </a>
        </div>
        <Menu
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          mode="inline"
          theme="dark"
          inlineCollapsed={this.props.collapsed}
          onOpenChange={this.onOpenChange}
          onSelect={this.onSelect}
        >
        <SubMenu key="imports" title={<span><Icon type="mail" /><span>Imports</span></span>}>
        <Menu.Item key="running"><NavLink to={{ pathname: '/imports/running' }}>
                        Running
                                    </NavLink></Menu.Item>
                                    <Menu.Item key="failed"><NavLink to={{ pathname: '/imports/failed' }}>
                        Failed
                                    </NavLink></Menu.Item>
        </SubMenu>
              
                        <Menu.Item key="assembly"><NavLink to={{ pathname: '/assembly' }}>
                        CoL Assembly
                                    </NavLink></Menu.Item>
                        
                        
          <SubMenu key="dataset" title={<span><Icon type="mail" /><span>Dataset</span></span>}>
            <Menu.Item key="/dataset">
            <NavLink to="/dataset">Search</NavLink>
            </Menu.Item>
            <Menu.Item key="datasetCreate">
                            <NavLink to={{ pathname: '/dataset/create' }}>
                                New Dataset
                </NavLink>

                        </Menu.Item>
            {selectedDataset && 
                                  <SubMenu key="datasetKey" title={`Dataset ID: ${selectedDataset.key}`} >
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
                                  </SubMenu>
            }
            {/* <Menu.Item key="7">Duplicates</Menu.Item>
            <Menu.Item key="8">Constituents</Menu.Item>
            <Menu.Item key="9">Without endpoint</Menu.Item> */}
          </SubMenu>
          
        </Menu>
      </React.Fragment>
    );
  }
}

export default withRouter(injectSheet(styles)(BasicMenu));