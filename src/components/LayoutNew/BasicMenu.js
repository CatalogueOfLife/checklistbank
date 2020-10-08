import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { withRouter } from "react-router";
import injectSheet from "react-jss";

import {
  ApiOutlined,
  BarsOutlined,
  CopyOutlined,
  MenuOutlined,
  ProjectOutlined,
  SettingOutlined,
  TableOutlined,
  LineChartOutlined,
  PartitionOutlined,
  CheckOutlined,
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  TagsOutlined,
  TagOutlined,
} from "@ant-design/icons";

import { Menu, Alert } from "antd";
import Logo from "./Logo";
import _ from "lodash";
import Auth from "../Auth";
import withContext from "../hoc/withContext";
import config from "../../config";
import CatalogueSelect from "./CatalogueSelect";
import SourceSelect from "./SourceDatasetSelect";
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
    const {
      selectedKeys,
      openKeys,
      _openKeys,
      setSelectedKeys,
      setOpenKeys,
    } = this.props;
    if (openKeys) {
      setOpenKeys([...new Set([...openKeys, ..._openKeys])]);
    }
    setSelectedKeys(selectedKeys);
    // this.setState({ selectedKeys, openKeys });
  };

  componentDidUpdate = (prevProps) => {
    let state = {};
    const { _openKeys, setSelectedKeys, setOpenKeys } = this.props;
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
    if (state.selectedKeys) {
      setSelectedKeys(state.selectedKeys);
      // this.setState({selectedKeys: state.selectedKeys});
    }
    if (state.openKeys) {
      setOpenKeys(state.openKeys);
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

  onOpenChange = (openKeys) => {
    const { setOpenKeys } = this.props;
    setOpenKeys(openKeys);
    // setOpenKeys([...new Set([..._openKeys, ...openKeys])])
    //  this.setState({ openKeys: [...new Set([...this.props.openKeys, ...openKeys])] });
  };
  onSelect = ({ item, key, selectedKeys }) => {
    const { setSelectedKeys } = this.props;
    setSelectedKeys(selectedKeys);
    //  this.setState({ selectedKeys });
  };

  isSourceDataset = (dataset) => {
    const { catalogueKey } = this.props;
    return (
      _.isArray(dataset.contributesTo) &&
      dataset.contributesTo.includes(catalogueKey)
    );
  };
  render() {
    const {
      dataset: selectedDataset,
      selectedSector,
      user,
      recentDatasets,
      taxonOrNameKey,
      catalogueKey,
      _selectedKeys,
      _openKeys,
    } = this.props;
    const hasData =
      !_.get(selectedDataset, "deleted") &&
      (_.get(selectedDataset, "size") ||
        _.get(selectedDataset, "origin") === "managed" ||
        _.get(selectedDataset, "origin") === "released");
    //  const catalogueKey = selectedCatalogue ? selectedCatalogue.key : MANAGEMENT_CLASSIFICATION.key
    //  const { selectedKeys, openKeys } = this.state;
    return (
      <React.Fragment>
        <div className="logo">
          <NavLink
            to={{
              pathname: `/`,
            }}
            exact={true}
          >
            <Logo style={{ marginLeft: "10px" }} />{" "}
            <h1 style={{ color: "white", display: "inline" }}>ChecklistBank</h1>
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
          {config.env === "dev" && (
            <Alert
              type="warning"
              style={{ margin: "6px" }}
              message={
                <div style={{ textAlign: "center" }}>Test enviroment</div>
              }
            />
          )}
          {Auth.isAuthorised(user, ["editor", "admin"]) && (
            <SubMenu
              key="admin"
              title={
                <span>
                  <SettingOutlined />
                  <span>Admin</span>
                </span>
              }
            >
              <Menu.Item key="esAdmin">
                <NavLink to={{ pathname: "/admin/es" }}>
                  <span>Elastic</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="adminSettings">
                <NavLink to={{ pathname: "/admin/settings" }}>
                  <span>Settings</span>
                </NavLink>
              </Menu.Item>
            </SubMenu>
          )}

          {Auth.isAuthorised(user, ["editor", "admin"]) && (
            <SubMenu
              key="imports"
              title={
                <span>
                  <ApiOutlined />
                  <span>Imports</span>
                </span>
              }
            >
              <Menu.Item key="running">
                <NavLink to={{ pathname: "/imports/running" }}>Running</NavLink>
              </Menu.Item>

              <Menu.Item key="finished">
                <NavLink to={{ pathname: "/imports/finished" }}>
                  Finished
                </NavLink>
              </Menu.Item>
            </SubMenu>
          )}
          {Auth.isAuthorised(user, ["editor"]) && (
            <SubMenu
              key="assembly"
              title={
                <span>
                  <ProjectOutlined />
                  <CatalogueSelect />
                  <span>{`Project: ${catalogueKey}`}</span>
                </span>
              }
            >
              <SubMenu
                key="projectDetails"
                title={
                  <span>
                    <MenuOutlined />
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
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/names` }}
                  >
                    <span>Names</span>
                  </NavLink>
                </Menu.Item>
                <Menu.Item key="assemblyDuplicates">
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/duplicates` }}
                  >
                    <span>Duplicates</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Item key="sectorSync">
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/sector/sync` }}
                  >
                    <span>Sector sync</span>
                  </NavLink>
                </Menu.Item>
                {/*               <Menu.Item key="catalogueSectors">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector` }}>
                  <span>Sectors</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueDecisions">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/decision` }}>
                  <span>Decisions</span>
                </NavLink>
              </Menu.Item> */}

                {selectedSector && (
                  <Menu.Item key="sectorDiff">
                    Sector diff: {selectedSector}
                  </Menu.Item>
                )}

                <Menu.Item key="assemblyReferences">
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/references` }}
                  >
                    <span>References</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Item key="catalogueOptions">
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/options` }}
                  >
                    <span>Project options</span>
                  </NavLink>
                </Menu.Item>

                {_selectedKeys &&
                  _selectedKeys.includes("catalogueTaxon") &&
                  taxonOrNameKey && (
                    <Menu.Item key="catalogueTaxon">
                      Taxon: {taxonOrNameKey}
                    </Menu.Item>
                  )}
                {_selectedKeys &&
                  _selectedKeys.includes("catalogueName") &&
                  taxonOrNameKey && (
                    <Menu.Item key="catalogueName">
                      Name: {taxonOrNameKey}
                    </Menu.Item>
                  )}
              </SubMenu>
              <Menu.Item key="colAssembly">
                <NavLink
                  to={{ pathname: `/catalogue/${catalogueKey}/assembly` }}
                >
                  <CopyOutlined />
                  <span>Assembly</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueSectors">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector` }}>
                  <PartitionOutlined />
                  <span>Sectors</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueDecisions">
                <NavLink
                  to={{ pathname: `/catalogue/${catalogueKey}/decision` }}
                >
                  <CheckOutlined />
                  <span>Decisions</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueSources">
                <NavLink
                  to={{
                    pathname: `/catalogue/${catalogueKey}/sources`,
                  }}
                >
                  {" "}
                  <TableOutlined />
                  <span>Source datasets</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="catalogueSourceMetrics">
                <NavLink
                  to={{
                    pathname: `/catalogue/${catalogueKey}/sourcemetrics`,
                  }}
                >
                  {" "}
                  <LineChartOutlined />
                  <span>Source metrics</span>
                </NavLink>
              </Menu.Item>
              {
                <SubMenu
                  key="sourceDataset"
                  title={
                    <span>
                      <SourceSelect catalogueKey={catalogueKey} />
                      <span
                        style={{ textOverflow: "ellipsis", maxWidth: "40px" }}
                      >
                        {selectedDataset &&
                        this.isSourceDataset(selectedDataset)
                          ? `${
                              selectedDataset.alias
                                ? selectedDataset.alias
                                : "Source"
                            } [${selectedDataset.key}]`
                          : "Select source"}
                      </span>
                    </span>
                  }
                >
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_issues">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/issues`,
                          }}
                        >
                          Issues
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_tasks">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/tasks`,
                          }}
                        >
                          Tasks
                        </NavLink>
                      </Menu.Item>
                    )}

                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_workbench">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/workbench`,
                          }}
                        >
                          Workbench
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_duplicates">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/duplicates`,
                          }}
                        >
                          Duplicates
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset && this.isSourceDataset(selectedDataset) && (
                    <Menu.Item key="source_meta">
                      <NavLink
                        to={{
                          pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/meta`,
                        }}
                      >
                        Metadata
                      </NavLink>
                    </Menu.Item>
                  )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_classification">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/classification`,
                          }}
                        >
                          Classification
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_references">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/references`,
                          }}
                        >
                          References
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_verbatim">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/verbatim`,
                          }}
                        >
                          Verbatim
                        </NavLink>
                      </Menu.Item>
                    )}
                  {selectedDataset &&
                    this.isSourceDataset(selectedDataset) &&
                    hasData && (
                      <Menu.Item key="source_imports">
                        <NavLink
                          to={{
                            pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                              selectedDataset,
                              "key"
                            )}/imports`,
                          }}
                        >
                          Imports
                        </NavLink>
                      </Menu.Item>
                    )}
                  {_.isArray(_selectedKeys) &&
                    _selectedKeys.includes("source_taxon") &&
                    taxonOrNameKey && (
                      <Menu.Item key="source_taxon">
                        Taxon: {taxonOrNameKey}
                      </Menu.Item>
                    )}
                  {_.isArray(_selectedKeys) &&
                    _selectedKeys.includes("source_name") &&
                    taxonOrNameKey && (
                      <Menu.Item key="source_name">
                        Name: {taxonOrNameKey}
                      </Menu.Item>
                    )}
                </SubMenu>
              }
            </SubMenu>
          )}

          {!user && (
            <Menu.Item>
              <NavLink
                to={{
                  pathname: `/dataset/3LR`,
                }}
              >
                <TagOutlined />
                CoL: latest release
              </NavLink>
            </Menu.Item>
          )}
          {!user && (
            <Menu.Item>
              <NavLink
                to={{
                  pathname: "/dataset",
                  search: "?releasedFrom=3",
                }}
              >
                <TagsOutlined />
                CoL: releases
              </NavLink>
            </Menu.Item>
          )}
          {user && recentDatasets && recentDatasets.length > 1 && (
            <SubMenu
              key="recentDatasets"
              title={
                <span>
                  <HistoryOutlined />
                  <span>Recently visited datasets</span>
                </span>
              }
            >
              {recentDatasets.map((d) => (
                <Menu.Item key={`recent_${d.key}`}>
                  <NavLink
                    to={{
                      pathname: `/dataset/${d.key}`,
                    }}
                  >
                    {d.alias ? d.alias : d.key}
                  </NavLink>
                </Menu.Item>
              ))}
            </SubMenu>
          )}
          <Menu.Item key="/dataset">
            <NavLink to="/dataset">
              <SearchOutlined />
              Dataset search
            </NavLink>
          </Menu.Item>

          {Auth.isAuthorised(user, ["editor", "admin"]) && (
            <Menu.Item key="datasetCreate">
              <NavLink to={{ pathname: "/newdataset" }}>
                <PlusOutlined />
                New Dataset
              </NavLink>
            </Menu.Item>
          )}

          {selectedDataset && (
            <SubMenu
              key="datasetKey"
              title={
                <span>
                  <BarsOutlined />
                  <span>
                    {selectedDataset.alias || `Dataset: ${selectedDataset.key}`}
                  </span>
                </span>
              }
            >
              <Menu.Item key="meta">
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(selectedDataset, "key")}/meta`,
                  }}
                >
                  Metadata
                </NavLink>
              </Menu.Item>
              {Auth.isAuthorised(user, ["editor", "admin"]) && (
                <Menu.Item key="options">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/options`,
                    }}
                  >
                    Options
                  </NavLink>
                </Menu.Item>
              )}

              {selectedDataset && hasData && (
                <Menu.Item key="classification">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/classification`,
                    }}
                  >
                    Classification
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && !selectedDataset.deleted && (
                <Menu.Item key="names">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/names`,
                    }}
                  >
                    Names
                  </NavLink>
                </Menu.Item>
              )}
              {_.get(selectedDataset, "origin") !== "released" && (
                <Menu.Item key="imports">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/imports`,
                    }}
                  >
                    {selectedDataset.origin !== "managed"
                      ? "Imports"
                      : "Releases"}
                  </NavLink>
                </Menu.Item>
              )}
              {user &&
                selectedDataset &&
                _.get(selectedDataset, "origin") !== "released" &&
                hasData && (
                  <Menu.Item key="issues">
                    <NavLink
                      to={{
                        pathname: `/dataset/${_.get(
                          selectedDataset,
                          "key"
                        )}/issues`,
                      }}
                    >
                      Issues
                    </NavLink>
                  </Menu.Item>
                )}
              {user && selectedDataset && hasData && (
                <Menu.Item key="references">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/references`,
                    }}
                  >
                    References
                  </NavLink>
                </Menu.Item>
              )}
              {selectedDataset && selectedDataset.size && (
                <Menu.Item key="verbatim">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/verbatim`,
                    }}
                  >
                    Verbatim
                  </NavLink>
                </Menu.Item>
              )}

              {user && selectedDataset && hasData && (
                <Menu.Item key="projects">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/projects`,
                    }}
                  >
                    Projects
                  </NavLink>
                </Menu.Item>
              )}

              {_.isArray(_selectedKeys) &&
                _selectedKeys.includes("taxon") &&
                taxonOrNameKey && (
                  <Menu.Item key="taxon">Taxon: {taxonOrNameKey}</Menu.Item>
                )}
              {_.isArray(_selectedKeys) &&
                _selectedKeys.includes("name") &&
                taxonOrNameKey && (
                  <Menu.Item key="name">Name: {taxonOrNameKey}</Menu.Item>
                )}
            </SubMenu>
          )}
        </Menu>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({
  user,
  recentDatasets,
  catalogueKey,
  dataset,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
}) => ({
  user,
  recentDatasets,
  catalogueKey,
  dataset,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
});

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
