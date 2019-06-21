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
      user
    } = this.props;
    const { selectedKeys, openKeys } = this.state;
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
          <Menu.Item key="admin">
            <NavLink to={{ pathname: "/admin" }}>
              <Icon type="setting" />
              <span>Admin</span>
            </NavLink>
          </Menu.Item>
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
              {selectedDataset && selectedDataset.importState && (
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

              {selectedDataset && selectedDataset.importState && (
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
              {selectedDataset && selectedDataset.importState && (
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
              {selectedDataset && selectedDataset.importState && (
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
              {selectedDataset && selectedDataset.importState && (
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

              {selectedDataset && selectedDataset.importState && (
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
              {selectedDataset && selectedDataset.importState && (
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

const mapContextToProps = ({ user }) => ({ user });

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
