import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { withRouter } from "react-router";
import injectSheet from "react-jss";
import { Menu, Icon } from "antd";
import Logo from "./Logo";
import _ from "lodash";
import Auth from "../Auth";
import withContext from "../hoc/withContext";
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

  componentWillReceiveProps = nextProps => {
    let state = {};

    if (
      JSON.stringify(nextProps.selectedKeys) !==
      JSON.stringify(this.props.selectedKeys)
    ) {
      state.selectedKeys = nextProps.selectedKeys;
    }
    if (nextProps.collapsed) {
      state.openKeys = [];
    } else if (
      JSON.stringify(nextProps.openKeys) !== JSON.stringify(this.props.openKeys)
    ) {
      state.openKeys = nextProps.openKeys;
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

  render() {
    const {
      location,
      selectedDataset,
      selectedTaxon,
      selectedName,
      selectedSector,
      user,
      recentDatasets
    } = this.props;
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
            <Logo />
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
                  <Icon type="copy" /> <span>Catalogue</span>
                </span>
              }
            >
              <Menu.Item key="colAssembly">
                <NavLink to={{ pathname: "/assembly" }}>
                  <span>Assembly</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="assemblyDuplicates">
                <NavLink to={{ pathname: "/assembly/duplicates" }}>
                  <span>Duplicates</span>
                </NavLink>
              </Menu.Item>

              <Menu.Item key="sectorSync">
                <NavLink to={{ pathname: "/sector/sync" }}>
                  <span>Sector sync</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="sectorBroken">
                <NavLink to={{ pathname: "/sector/broken" }}>
                  <span>Broken sectors</span>
                </NavLink>
              </Menu.Item>

              {selectedSector && (
                <Menu.Item key="sectorDiff">
                  Sector diff: {selectedSector}
                </Menu.Item>
              )}

<Menu.Item key="assemblyReferences">
                <NavLink to={{ pathname: "/assembly/reference" }}>
                  <span>References</span>
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
                <Menu.Item key="nameIndex">
    <NavLink to={{ pathname: "/names" }}>
              <span>Name index</span>
            </NavLink>
    </Menu.Item>
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
         {recentDatasets && recentDatasets.length > 1 && <SubMenu
              key="recentDatasets"
              title={
                <span>
                  <Icon type="star" />
                  <span>Recently visited datasets</span>
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
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
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

              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
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
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
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
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
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
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
                <Menu.Item key="issues">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/issues`
                    }}
                  >
                    Issues
                  </NavLink>
                </Menu.Item>
              )}
              <Menu.Item key="metrics">
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      this.props,
                      "selectedDataset.key"
                    )}/metrics`
                  }}
                >
                  Import Metrics
                </NavLink>
              </Menu.Item>
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
                <Menu.Item key="tasks">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/tasks`
                    }}
                  >
                    Tasks
                  </NavLink>
                </Menu.Item>
              )}

              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
                <Menu.Item key="workbench">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/workbench`
                    }}
                  >
                    Workbench
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && (selectedDataset.importState || Number(selectedDataset.key) < 1001) && (
                <Menu.Item key="duplicates">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        this.props,
                        "selectedDataset.key"
                      )}/duplicates`
                    }}
                  >
                    Duplicates
                  </NavLink>
                </Menu.Item>
              )}
              {selectedTaxon && (
                <Menu.Item key="taxon">Taxon: {selectedTaxon.id}</Menu.Item>
              )}
              {selectedName && (
                <Menu.Item key="name">Name: {selectedName.id}</Menu.Item>
              )}

              {selectedKeys.includes("verbatim") && (
                <Menu.Item key="verbatim">Verbatim</Menu.Item>
              )}
            </SubMenu>
          )}
        </Menu>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, recentDatasets }) => ({ user, recentDatasets });

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
