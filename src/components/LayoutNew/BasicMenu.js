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
            <Menu.Item key="assembly">
              <NavLink to={{ pathname: "/assembly" }}>
                <Icon type="copy" /> <span>CoL Assembly</span>
              </NavLink>
            </Menu.Item>
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
                <NavLink to={{ pathname: "/dataset/create" }}>
                  New Dataset
                </NavLink>
              </Menu.Item>
            )}

            {/* <Menu.Item key="7">Duplicates</Menu.Item>
            <Menu.Item key="8">Constituents</Menu.Item>
            <Menu.Item key="9">Without endpoint</Menu.Item> */}
          </SubMenu>
          {selectedDataset && (
              <SubMenu
                key="datasetKey"
                title={<span><Icon type="bars" /><span>{`Dataset ID: ${selectedDataset.key}`}</span></span>}
              >
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
                {Auth.isAuthorised(user, ["editor", "admin"]) && (
                  <Menu.Item key="sources">
                    <NavLink
                      to={{
                        pathname: `/dataset/${_.get(
                          this.props,
                          "selectedDataset.key"
                        )}/sources`
                      }}
                    >
                      CoL Sources
                    </NavLink>
                  </Menu.Item>
                )}
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
                {selectedTaxon && (
                  <Menu.Item key="taxon">
                    Taxon ID: {selectedTaxon.id}
                  </Menu.Item>
                )}
                {selectedName && (
                  <Menu.Item key="name">Name ID: {selectedName.id}</Menu.Item>
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
