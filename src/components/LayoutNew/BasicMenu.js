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

    this.state = {
      selectedKeys: [],
      openKeys: []
    };
  }

  componentDidMount = () => {
    const { selectedKeys, openKeys } = this.props;
    this.setState({ selectedKeys, openKeys });
  };

  componentDidUpdate = prevProps => {
    let state = {};

    if (
      JSON.stringify(prevProps.selectedKeys) !==
      JSON.stringify(this.props.selectedKeys)
    ) {
      state.selectedKeys = this.props.selectedKeys;
    }
    if (this.props.collapsed) {
      state.openKeys = [];
    } else if (
      JSON.stringify(this.props.openKeys) !== JSON.stringify(prevProps.openKeys)
    ) {
      state.openKeys = this.props.openKeys;
    }
    if (!_.isEmpty(state)) {
      this.setState(state);
    }
  };


  onOpenChange = openKeys => {
    this.setState({ openKeys });
  };
  onSelect = ({ item, key, selectedKeys }) => {
    this.setState({ selectedKeys });
  };

  isSourceDataset = (dataset) => {
    const {catalogueKey} = this.props;
    return  _.isArray(dataset.contributesTo) && dataset.contributesTo.includes(catalogueKey)
  }
  render() {
    const {
      selectedDataset,
      selectedSector,
      user,
      recentDatasets,
      taxonOrNameKey,
      catalogueKey
    } = this.props;
    const hasData = !_.get(selectedDataset, 'deleted') && (_.get(selectedDataset, 'hasData') || _.get(selectedDataset, 'origin') === 'managed');
  //  const catalogueKey = selectedCatalogue ? selectedCatalogue.key : MANAGEMENT_CLASSIFICATION.key
    const { selectedKeys, openKeys } = this.state;
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
          selectedKeys={selectedKeys}
          openKeys={openKeys}
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
                  <Icon type="copy" /> <span>{`Catalogue: ${catalogueKey}`}</span> <CatalogueSelect />
                </span>
              }
            >
            <Menu.Item key="catalogueSources">
              <NavLink to={{
                    pathname: `/catalogue/${catalogueKey}/sources`
                  }}>Source datasets</NavLink>
            </Menu.Item>
              {selectedDataset &&  this.isSourceDataset(selectedDataset) &&  <SubMenu
              key="sourceDataset"
              title={
                <span>
                  <Icon type="bars" />
                  <span>{`Source: ${selectedDataset.key}`}</span> <SourceSelect />
                </span>
              }
            >
              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="issues">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/issues`
                    }}
                  >
                    Issues
                  </NavLink>
                </Menu.Item>
              )}
                            {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="tasks">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
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
                        this.props,
                        "selectedDataset.key"
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
                        this.props,
                        "selectedDataset.key"
                      )}/duplicates`
                    }}
                  >
                    Duplicates
                  </NavLink>
                </Menu.Item>
              )}
              </SubMenu>}
              
              <Menu.Item key="catalogueMeta">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/meta` }}>
                  <span>Metadata</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="colAssembly">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/assembly` }}>
                  <span>Assembly</span>
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

              {selectedKeys && selectedKeys.includes("catalogueTaxon") && taxonOrNameKey && (
                <Menu.Item key="catalogueTaxon">Taxon: {taxonOrNameKey}</Menu.Item>
              )}
              {selectedKeys && selectedKeys.includes("catalogueName") && taxonOrNameKey && (
                <Menu.Item key="catalogueName">Name: {taxonOrNameKey}</Menu.Item>
              )}
              
              
              <Menu.Item key="catalogueOptions">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/options` }}>
                <Icon type="setting" /> <span>Options</span>
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
              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="reference">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/reference`
                    }}
                  >
                    References
                  </NavLink>
                </Menu.Item>
              )}

              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="classification">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/classification`
                    }}
                  >
                    Classification
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="sectors">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/sectors`
                    }}
                  >
                    Sectors
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset  && !selectedDataset.deleted  && (
                <Menu.Item key="names">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/names`
                    }}
                  >
                    Names
                  </NavLink>
                </Menu.Item>
              )}
              {/* {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="issues">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/issues`
                    }}
                  >
                    Issues
                  </NavLink>
                </Menu.Item>
              )} */}
            {<Menu.Item key="metrics">
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      this.props,
                      "selectedDataset.key"
                    )}/metrics`
                  }}
                >
                {selectedDataset.origin !== 'managed' ? 'Import Metrics' : 'Release Metrics'}  
                </NavLink>
              </Menu.Item> }
{/*               {selectedDataset && hasData &&  (selectedDataset.importState || selectedDataset.origin === 'managed') && (
                <Menu.Item key="tasks">
                  <NavLink
                    to={{
                      pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
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
                        this.props,
                        "selectedDataset.key"
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
                        this.props,
                        "selectedDataset.key"
                      )}/duplicates`
                    }}
                  >
                    Duplicates
                  </NavLink>
                </Menu.Item>
              )} */}
              {selectedKeys.includes("taxon") && taxonOrNameKey && (
                <Menu.Item key="taxon">Taxon: {taxonOrNameKey}</Menu.Item>
              )}
              {selectedKeys.includes("name") && taxonOrNameKey && (
                <Menu.Item key="name">Name: {taxonOrNameKey}</Menu.Item>
              )}

              {selectedDataset && selectedDataset.hasData && (
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
            </SubMenu>
          )}
        </Menu>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, recentDatasets, catalogueKey }) => ({ user, recentDatasets, catalogueKey });

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
