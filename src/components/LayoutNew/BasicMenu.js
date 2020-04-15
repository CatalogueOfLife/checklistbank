import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { withRouter } from "react-router";
import injectSheet from "react-jss";
import { Menu, Icon, Alert } from "antd";
import Logo from "./Logo";
import _ from "lodash";
import Auth from "../Auth";
import withContext from "../hoc/withContext";
import config from "../../config"
import CatalogueSelect from "./CatalogueSelect" 
import SourceSelect from "./SourceDatasetSelect"
const SubMenu = Menu.SubMenu;
const styles = {};


class BasicMenu extends Component {
  constructor(props) {
    super(props);

/*     this.state = {
      selectedKeys: this.props._selectedKeys,
      openKeys: this.props._openKeys
    }; */
  }

  componentDidMount = () => {
    const { selectedKeys, openKeys, _openKeys, setSelectedKeys, setOpenKeys } = this.props;
   if(openKeys){
    setOpenKeys([...new Set([...openKeys, ..._openKeys])])
   } 
    setSelectedKeys(selectedKeys);
   // this.setState({ selectedKeys, openKeys });
  };

  componentDidUpdate = prevProps => {
    let state = {};
    const {_openKeys, setSelectedKeys, setOpenKeys} = this.props;
    if (
      JSON.stringify(prevProps.selectedKeys) !==
      JSON.stringify(this.props.selectedKeys)
    ) {
      state.selectedKeys = this.props.selectedKeys;
    }
    if (!prevProps.collapsed && this.props.collapsed) {
     // state.openKeys = [];
    } else if (
      JSON.stringify(this.props.openKeys) !== JSON.stringify(prevProps.openKeys)
    ) {
      state.openKeys = [...new Set([...this.props.openKeys, ..._openKeys])];
    }
     if(state.selectedKeys){
      setSelectedKeys(state.selectedKeys)
     // this.setState({selectedKeys: state.selectedKeys});
    };
     if(state.openKeys){
      setOpenKeys(state.openKeys)
     // this.setState({openKeys: state.openKeys});
    }
/*     if (!_.isEmpty(state)) {
      if(state.selectedKeys && state.openKeys){
        this.setState(state);
      } else if(state.selectedKeys){
        this.setState({selectedKeys: state.selectedKeys});
      } else if(state.openKeys){
        this.setState({openKeys: state.openKeys});
      }
      
    } */
  };


  onOpenChange = openKeys => {
    const { setOpenKeys } = this.props;
    setOpenKeys(openKeys)
   // setOpenKeys([...new Set([..._openKeys, ...openKeys])])
  //  this.setState({ openKeys: [...new Set([...this.props.openKeys, ...openKeys])] });
  };
  onSelect = ({ item, key, selectedKeys }) => {
    const { setSelectedKeys } = this.props;
    setSelectedKeys(selectedKeys)
  //  this.setState({ selectedKeys });
  };

  isSourceDataset = (dataset) => {
    const {catalogueKey} = this.props;
    return  _.isArray(dataset.contributesTo) && dataset.contributesTo.includes(catalogueKey)
  }
  render() {
    const {
      dataset: selectedDataset,
      selectedSector,
      user,
      recentDatasets,
      taxonOrNameKey,
      catalogueKey,
      _selectedKeys,
      _openKeys
    } = this.props;
    const hasData = !_.get(selectedDataset, 'deleted') && (_.get(selectedDataset, 'size') || _.get(selectedDataset, 'origin') === 'managed');
  //  const catalogueKey = selectedCatalogue ? selectedCatalogue.key : MANAGEMENT_CLASSIFICATION.key
  //  const { selectedKeys, openKeys } = this.state;
    return (
      <React.Fragment>

        <div className="logo">
        <NavLink
                  to={{
                    pathname: `/`
                  }}
                  exact={true}
                >
                  <Logo style={{marginLeft: '10px'}} /> <h1 style={{color: 'white', display: 'inline'}}>CoL Clearinghouse</h1>
                  </NavLink>
                  </div>
        
        <Menu
          selectedKeys={_selectedKeys}
          openKeys={_openKeys}
          mode="inline"
          theme="dark"
          inlineCollapsed={this.props.collapsed}
          onOpenChange={this.onOpenChange}
          onSelect={this.onSelect}
        >
{config.env === 'dev' &&  <Alert type="warning" style={{margin: '6px'}} message={<div style={{textAlign: 'center'}}>Test enviroment</div>}/>}       
 {Auth.isAuthorised(user, ["editor", "admin"]) &&  <Menu.Item key="admin">
            <NavLink to={{ pathname: "/admin" }}>
              <Icon type="setting" />
              <span>Admin</span>
            </NavLink>
    </Menu.Item> }

          <SubMenu
            key="imports"
            title={
              <span>
                <Icon type="api" />
                <span>Imports</span>
              </span>
            }
          >
            <Menu.Item key="running">
              <NavLink to={{ pathname: "/imports/running" }}>Running</NavLink>
            </Menu.Item>

            <Menu.Item key="finished">
              <NavLink to={{ pathname: "/imports/finished" }}>Finished</NavLink>
            </Menu.Item>
          </SubMenu>
          {Auth.isAuthorised(user, ["editor"]) && (
            <SubMenu
              key="assembly"
              title={
                <span>
                  <Icon type="project" /><CatalogueSelect /><span>{`Project: ${catalogueKey}`}</span> 
                </span>
              }
            >
              <SubMenu
            key="projectDetails"
            title={
              <span>
                <Icon type="menu" />
                <span>Project details</span>
              </span>
            }
          >
                          <Menu.Item key="catalogueMeta">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/meta` }}>
                  <span>Metadata</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueNameSearch">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/names` }}>
                  <span>Names</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="assemblyDuplicates">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/duplicates` }}>
                  <span>Duplicates</span>
                </NavLink>
              </Menu.Item>
              
              <Menu.Item key="sectorSync">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/sync` }}>
                  <span>Sector sync</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueSectors">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector` }}>
                  <span>Sectors</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueDecisions">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/decision` }}>
                  <span>Decisions</span>
                </NavLink>
              </Menu.Item>
              

              {selectedSector && (
                <Menu.Item key="sectorDiff">
                  Sector diff: {selectedSector}
                </Menu.Item>
              )}

            <Menu.Item key="assemblyReferences">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/reference` }}>
                  <span>References</span>
                </NavLink>
              </Menu.Item>

              {_selectedKeys && _selectedKeys.includes("catalogueTaxon") && taxonOrNameKey && (
                <Menu.Item key="catalogueTaxon">Taxon: {taxonOrNameKey}</Menu.Item>
              )}
              {_selectedKeys && _selectedKeys.includes("catalogueName") && taxonOrNameKey && (
                <Menu.Item key="catalogueName">Name: {taxonOrNameKey}</Menu.Item>
              )}

          </SubMenu>
          <Menu.Item key="colAssembly">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/assembly` }}>
                 <Icon type="copy" /><span>Assembly</span>
                </NavLink>
              </Menu.Item>
            <Menu.Item key="catalogueSources">
              <NavLink to={{
                    pathname: `/catalogue/${catalogueKey}/sources`
                  }}> <Icon type="table" /><span>Source datasets</span></NavLink>
            </Menu.Item>
              { <SubMenu
              key="sourceDataset"
              title={
                <span>
                  <SourceSelect catalogueKey={catalogueKey} />
                  <span style={{textOverflow: 'ellipsis', maxWidth:'40px'}}>{selectedDataset &&  this.isSourceDataset(selectedDataset) ?
                   `${selectedDataset.alias ? selectedDataset.alias : 'Source'} [${selectedDataset.key}]` : 'Select source'}</span> 
                   
                </span>
              }
            >
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData && (
                <Menu.Item key="issues">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/issues`
                    }}
                  >
                    Issues
                  </NavLink>
                </Menu.Item>
              )}
                            {selectedDataset &&  this.isSourceDataset(selectedDataset) &&  hasData  && (
                <Menu.Item key="tasks">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/tasks`
                    }}
                  >
                    Tasks
                  </NavLink>
                </Menu.Item>
              )}

              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData  && (
                <Menu.Item key="workbench">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/workbench`
                    }}
                  >
                    Workbench
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData  && (
                <Menu.Item key="duplicates">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/duplicates`
                    }}
                  >
                    Duplicates
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset)  && (
                <Menu.Item key="meta">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/meta`
                    }}
                  >
                    Metadata
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData && (
                <Menu.Item key="classification">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/classification`
                    }}
                  >
                    Classification
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData && (
                <Menu.Item key="references">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/references`
                    }}
                  >
                    References
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData && (
                <Menu.Item key="verbatim">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/verbatim`
                    }}
                  >
                    Verbatim
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset &&  this.isSourceDataset(selectedDataset) && hasData && (
                <Menu.Item key="imports">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/imports`
                    }}
                  >
                    Imports
                  </NavLink>
                </Menu.Item>
              )}
              {_.isArray(_selectedKeys) && _selectedKeys.includes("taxon") && taxonOrNameKey && (
                <Menu.Item key="taxon">Taxon: {taxonOrNameKey}</Menu.Item>
              )}
              {_.isArray(_selectedKeys) && _selectedKeys.includes("name") && taxonOrNameKey && (
                <Menu.Item key="name">Name: {taxonOrNameKey}</Menu.Item>
              )}
              </SubMenu>}
              

              
              
              <Menu.Item key="catalogueOptions">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/options` }}>
                <Icon type="tool" /> <span>Options</span>
                </NavLink>
              </Menu.Item>
            </SubMenu>
          )}

          <SubMenu
            key="dataset"
            title={
              <span>
                <Icon type="table" />
                <span>Datasets</span>
              </span>
            }
          >
                         {recentDatasets && recentDatasets.length > 1 && <SubMenu
              key="recentDatasets"
              title={
                <span>
                  <span>Recently visited</span>
                </span>
              }
            >
              {recentDatasets.map(d => <Menu.Item key={`recent_${d.key}`}>
                <NavLink
                  to={{
                    pathname: `/dataset/${d.key}`
                  }}
                >
                  {d.alias ? d.alias : d.key}
                </NavLink>
              </Menu.Item>)}

            </SubMenu> }
            <Menu.Item key="/dataset">
              <NavLink to="/dataset">Search</NavLink>
            </Menu.Item>
            

            {Auth.isAuthorised(user, ["editor", "admin"]) && (
              <Menu.Item key="datasetCreate">
                <NavLink to={{ pathname: "/newdataset" }}>New Dataset</NavLink>
              </Menu.Item>
            )}

            {/* <Menu.Item key="7">Duplicates</Menu.Item>
            <Menu.Item key="8">Constituents</Menu.Item>
            <Menu.Item key="9">Without endpoint</Menu.Item> */}
          </SubMenu>

          {selectedDataset && (
            <SubMenu
              key="datasetKey"
              title={
                <span>
                  <Icon type="bars" />
                  <span>{`Dataset: ${selectedDataset.key}`}</span>
                </span>
              }
            >
              <Menu.Item key="meta">
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      this.props,
                      "selectedDataset.key"
                    )}/meta`
                  }}
                >
                  Metadata
                </NavLink>
              </Menu.Item>
              {<Menu.Item key="imports">
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      this.props,
                      "selectedDataset.key"
                    )}/imports`
                  }}
                >
                {selectedDataset.origin !== 'managed' ? 'Imports' : 'Releases'}  
                </NavLink>
              </Menu.Item> }
              {selectedDataset && hasData  && (
                <Menu.Item key="classification">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/classification`
                    }}
                  >
                    Classification
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset  && !selectedDataset.deleted  && (
                <Menu.Item key="names">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/names`
                    }}
                  >
                    Names
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="reference">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/reference`
                    }}
                  >
                    References
                  </NavLink>
                </Menu.Item>
              )}
 {selectedDataset && selectedDataset.size && (
                <Menu.Item key="verbatim"><NavLink
                to={{
                  pathname: `/dataset/${_.get(
                    this.props,
                    "selectedDataset.key"
                  )}/verbatim`
                }}
              >
                Verbatim
              </NavLink></Menu.Item>
              )}
              
              {selectedDataset && hasData && (
                <Menu.Item key="sectors">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/sectors`
                    }}
                  >
                    Sectors
                  </NavLink>
                </Menu.Item>
              )}
              
              {/* {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="issues">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/issues`
                    }}
                  >
                    Issues
                  </NavLink>
                </Menu.Item>
              )} */}

{/*               {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="tasks">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/tasks`
                    }}
                  >
                    Tasks
                  </NavLink>
                </Menu.Item>
              )}

              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="workbench">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/workbench`
                    }}
                  >
                    Workbench
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="duplicates">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/duplicates`
                    }}
                  >
                    Duplicates
                  </NavLink>
                </Menu.Item>
              )} */}
              {_.isArray(_selectedKeys) && _selectedKeys.includes("taxon") && taxonOrNameKey && (
                <Menu.Item key="taxon">Taxon: {taxonOrNameKey}</Menu.Item>
              )}
              {_.isArray(_selectedKeys) && _selectedKeys.includes("name") && taxonOrNameKey && (
                <Menu.Item key="name">Name: {taxonOrNameKey}</Menu.Item>
              )}

             
            </SubMenu>
          )}
        </Menu>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, recentDatasets, catalogueKey, dataset, _selectedKeys, _openKeys, setSelectedKeys, setOpenKeys }) => ({ user, recentDatasets, catalogueKey, dataset, _selectedKeys, _openKeys, setSelectedKeys, setOpenKeys });

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
