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
  OrderedListOutlined,
  SearchOutlined,
  TagsOutlined,
  ToolOutlined,
} from "@ant-design/icons";

import { Menu, Alert } from "antd";
import Logo from "./Logo";
import _ from "lodash";
import Auth from "../Auth";
import withContext from "../hoc/withContext";
import config from "../../config";
import CatalogueSelect from "./CatalogueSelect";
import SourceSelect from "./SourceDatasetSelect";
import { truncate } from "../util";
const SubMenu = Menu.SubMenu;
const styles = {};
/* function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */
class BasicMenu extends Component {
  componentDidMount = () => {
    const { selectedKeys, openKeys, _openKeys, setSelectedKeys, setOpenKeys } =
      this.props;
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

  /*   isProjectRoute = () => {
      const { location } = this.props;
      return !!location && location.pathname.startsWith("/catalogue")
  
    } */

  selectedDatasetIsProjectAndUserHasAccess = (catalogue, dataset, user) => {
    return (
      (!dataset || catalogue?.key === dataset?.key) &&
      Auth.canViewDataset(catalogue, user)
    );
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
      sourceDataset,

      catalogue,
      selectedSector,
      user,
      //   recentDatasets,
      taxonOrNameKey,
      catalogueKey,
      _selectedKeys,
      _openKeys,
    } = this.props;
    const hasData =
      !_.get(selectedDataset, "deleted") &&
      (_.get(selectedDataset, "size") ||
        ["xrelease", "release", "project"].includes(
          _.get(selectedDataset, "origin")
        ));
    const sourceHasData =
      !_.get(sourceDataset, "deleted") &&
      (_.get(sourceDataset, "size") ||
        ["xrelease", "release", "project"].includes(
          _.get(sourceDataset, "origin")
        ));

    return (
      <React.Fragment>
        <div className="logo">
          <NavLink
            to={{
              pathname: `/`,
            }}
            exact={true}
          >
            <Logo />
            {/* <h1 style={{   display: "inline" }}>ChecklistBank</h1> */}
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
          {/*           {config.env === "dev" && (
            <Alert
              type="warning"
              style={{ margin: "6px" }}
              message={
                <div style={{ textAlign: "center" }}>Test enviroment</div>
              }
            />
          )} */}

          <SubMenu
            key="tools"
            title={
              <span>
                <ToolOutlined />
                <span>Tools</span>
              </span>
            }
          >
            <Menu.Item key="nameUsageSearch">
              <NavLink to={{ pathname: "/nameusage/search" }}>
                <span>Cross dataset search</span>
              </NavLink>
            </Menu.Item>
            <Menu.Item key="metadatagenerator">
              <NavLink to={{ pathname: "/tools/metadata-generator" }}>
                <span>Metadata generator</span>
              </NavLink>
            </Menu.Item>
            <Menu.Item key="namematch">
              <NavLink to={{ pathname: "/tools/name-match" }}>
                <span>Name match</span>
              </NavLink>
            </Menu.Item>
            {Auth.isAuthorised(user, ["admin", "editor"]) && (
              <Menu.Item key="gbif-impact">
                <NavLink to={{ pathname: "/tools/gbif-impact" }}>
                  <span>GBIF impact</span>
                </NavLink>
              </Menu.Item>
            )}
            {Auth.isAuthorised(user, ["admin", "editor"]) && (
              <Menu.Item key="diffviewer">
                <NavLink to={{ pathname: "/tools/diff-viewer" }}>
                  <span>Diff viewer</span>
                </NavLink>
              </Menu.Item>
            )}
            {user && (
              <Menu.Item key="datasetComparison">
                <NavLink to={{ pathname: "/tools/dataset-comparison" }}>
                  <span>Dataset comparison</span>
                </NavLink>
              </Menu.Item>
            )}

            {Auth.isAuthorised(user, ["admin", "editor"]) && (
              <Menu.Item key="nameIndexSearch">
                <NavLink to={{ pathname: "/namesindex" }}>
                  <span>Names index search</span>
                </NavLink>
              </Menu.Item>
            )}

            {_.isArray(_selectedKeys) &&
              _selectedKeys.includes("nameIndexKey") &&
              taxonOrNameKey && (
                <Menu.Item key="nameIndexKey">Nidx: {taxonOrNameKey}</Menu.Item>
              )}
          </SubMenu>

          {Auth.isAuthorised(user, ["admin"]) && (
            <SubMenu
              key="admin"
              title={
                <span>
                  <SettingOutlined />
                  <span>Admin</span>
                </span>
              }
            >
              <Menu.Item key="userAdmin">
                <NavLink to={{ pathname: "/admin/users" }}>
                  <span>Users</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="adminSettings">
                <NavLink to={{ pathname: "/admin/settings" }}>
                  <span>Settings</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="esAdmin">
                <NavLink to={{ pathname: "/admin/datasets" }}>
                  <span>Datasets</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="backgroundJobs">
                <NavLink to={{ pathname: "/admin/jobs" }}>
                  <span>Background jobs</span>
                </NavLink>
              </Menu.Item>
            </SubMenu>
          )}

          {/* {Auth.isAuthorised(user, ["editor", "admin"]) && (
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
          )} */}
          {Auth.isAuthorised(user, ["editor", "admin"]) && (
            <Menu.Item key="backgroundImports">
              <NavLink to={{ pathname: "/imports" }}>
                <ApiOutlined />
                <span>Imports</span>
              </NavLink>
            </Menu.Item>
          )}
          <Menu.Item key="/dataset">
            <NavLink to="/dataset">
              <SearchOutlined />
              <span>Datasets</span>
            </NavLink>
          </Menu.Item>
          {this.selectedDatasetIsProjectAndUserHasAccess(
            catalogue,
            selectedDataset,
            user
          ) && (
            <SubMenu
              key="assembly"
              title={
                <span>
                  <BarsOutlined />
                  <span>
                    {catalogue?.alias || `Project: ${catalogue?.key}`}
                  </span>
                </span>
              }
            >
              {catalogue && (
                <>
                  <Menu.Item key="colAssembly">
                    <NavLink
                      to={{ pathname: `/catalogue/${catalogueKey}/assembly` }}
                    >
                      {/* <CopyOutlined /> */}
                      <span>Assembly</span>
                    </NavLink>
                  </Menu.Item>
                  <Menu.Item key="catalogueSectors">
                    <NavLink
                      to={{ pathname: `/catalogue/${catalogueKey}/sector` }}
                    >
                      {/* <PartitionOutlined /> */}
                      <span>Sectors</span>
                    </NavLink>
                  </Menu.Item>
                  {/* <Menu.Item key="catalogueSectorPriority">
                <NavLink to={{ pathname: `/catalogue/${catalogueKey}/sector/priority` }}>
                  <OrderedListOutlined />
                  <span>Sector priority</span>
                </NavLink>
              </Menu.Item> */}
                  <Menu.Item key="catalogueDecisions">
                    <NavLink
                      to={{ pathname: `/catalogue/${catalogueKey}/decision` }}
                    >
                      {/*  <CheckOutlined /> */}
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
                      {/*  <TableOutlined /> */}
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
                      {/* <LineChartOutlined /> */}
                      <span>Source metrics</span>
                    </NavLink>
                  </Menu.Item>
                  {/*               <SubMenu
                key="projectDetails"
                title={
                  <span>
                    <MenuOutlined />
                    <span>More...</span>
                  </span>
                }
              > */}
                  <Menu.Item key="catalogueMeta">
                    <NavLink
                      to={{ pathname: `/catalogue/${catalogueKey}/metadata` }}
                    >
                      <span>Metadata</span>
                    </NavLink>
                  </Menu.Item>
                  {Auth.canEditDataset({ key: catalogueKey }, user) && (
                    <Menu.Item key="projectEditors">
                      <NavLink
                        to={{ pathname: `/catalogue/${catalogueKey}/editors` }}
                      >
                        <span>Editors</span>
                      </NavLink>
                    </Menu.Item>
                  )}
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
                  <Menu.Item key="assemblyTasks">
                    <NavLink
                      to={{ pathname: `/catalogue/${catalogueKey}/tasks` }}
                    >
                      <span>Tasks</span>
                    </NavLink>
                  </Menu.Item>
                  {/*  <Menu.Item key="sectorSync">
                  <NavLink
                    to={{ pathname: `/catalogue/${catalogueKey}/sector/sync` }}
                  >
                    <span>Sector sync</span>
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
                  <Menu.Item key="releases">
                    <NavLink
                      to={{
                        pathname: "/dataset",
                        search: `?releasedFrom=${catalogueKey}`,
                      }}
                    >
                      <span>Releases</span>
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
                  {/*               </SubMenu>
                   */}{" "}
                  {
                    <SubMenu
                      key="sourceDataset"
                      title={
                        <span>
                          Source
                          {/* <SourceSelect catalogueKey={catalogueKey} />
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
                      </span> */}
                        </span>
                      }
                    >
                      {
                        <Menu.ItemGroup
                          title={
                            <>
                              <SourceSelect catalogueKey={catalogueKey} />{" "}
                              {sourceDataset && sourceHasData
                                ? sourceDataset?.alias ||
                                  truncate(sourceDataset?.title, 25)
                                : "Select"}
                            </>
                          }
                        >
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_issues">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/issues`,
                                }}
                              >
                                Issues
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_tasks">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/tasks`,
                                }}
                              >
                                Tasks
                              </NavLink>
                            </Menu.Item>
                          )}

                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_workbench">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/workbench`,
                                }}
                              >
                                Workbench
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_duplicates">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/duplicates`,
                                }}
                              >
                                Duplicates
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && (
                            <Menu.Item key="source_metadata">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/metadata`,
                                }}
                              >
                                Metadata
                              </NavLink>
                            </Menu.Item>
                          )}

                          {sourceDataset && (
                            <Menu.Item key="sourceSectors">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/sector`,
                                  search: `?subjectDatasetKey=${sourceDataset.key}`,
                                }}
                              >
                                Sectors
                              </NavLink>
                            </Menu.Item>
                          )}

                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_classification">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/classification`,
                                }}
                              >
                                Classification
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_references">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/references`,
                                }}
                              >
                                References
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_verbatim">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
                                    "key"
                                  )}/verbatim`,
                                }}
                              >
                                Verbatim
                              </NavLink>
                            </Menu.Item>
                          )}
                          {sourceDataset && sourceHasData && (
                            <Menu.Item key="source_imports">
                              <NavLink
                                to={{
                                  pathname: `/catalogue/${catalogueKey}/dataset/${_.get(
                                    sourceDataset,
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
                        </Menu.ItemGroup>
                      }
                    </SubMenu>
                  }
                </>
              )}
            </SubMenu>
          )}

          {!user && (
            <Menu.Item key="colreleases">
              <NavLink
                to={{
                  pathname: "/dataset",
                  search: "?releasedFrom=3&sortBy=created",
                }}
              >
                <TagsOutlined />
                <span>COL: releases</span>
              </NavLink>
            </Menu.Item>
          )}
          {/*           {user && recentDatasets && recentDatasets.length > 1 && (
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
          )} */}

          {selectedDataset &&
            !this.selectedDatasetIsProjectAndUserHasAccess(
              catalogue,
              selectedDataset,
              user
            ) && (
              <SubMenu
                key="datasetKey"
                title={
                  <span>
                    <BarsOutlined />
                    <span>
                      {selectedDataset.alias ||
                        `Dataset: ${selectedDataset.key}`}
                    </span>
                  </span>
                }
              >
                {/*  {Auth.canEditDataset(selectedDataset, user) && (
                <Menu.Item key="metadata">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/metadata`,
                    }}
                  >
                    Metadata
                  </NavLink>
                </Menu.Item>
              )} */}
                <Menu.Item key="about">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/about`,
                    }}
                  >
                    About
                  </NavLink>
                </Menu.Item>
                {Auth.canEditDataset(selectedDataset, user) &&
                  !selectedDataset.deleted && (
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
                {Auth.canEditDataset(selectedDataset, user) &&
                  !["xrelease", "release"].includes(
                    _.get(selectedDataset, "origin")
                  ) && (
                    <Menu.Item key="editors">
                      <NavLink
                        to={{
                          pathname: `/dataset/${selectedDataset?.key}/editors`,
                        }}
                      >
                        <span>Editors</span>
                      </NavLink>
                    </Menu.Item>
                  )}
                {Auth.canEditDataset(selectedDataset, user) &&
                  !selectedDataset.deleted && (
                    <Menu.Item key="datasetDuplicateSearch">
                      <NavLink
                        to={{
                          pathname: `/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/duplicates`,
                        }}
                      >
                        Duplicate search
                      </NavLink>
                    </Menu.Item>
                  )}
                {Auth.canEditDataset(selectedDataset, user) &&
                  !selectedDataset.deleted && (
                    <Menu.Item key="datasetDuplicateTasks">
                      <NavLink
                        to={{
                          pathname: `/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/duplicates/overview`,
                        }}
                      >
                        Duplicate overview
                      </NavLink>
                    </Menu.Item>
                  )}

                {!selectedDataset.deleted && (
                  <Menu.Item key="download">
                    <NavLink
                      to={{
                        pathname: `/dataset/${_.get(
                          selectedDataset,
                          "key"
                        )}/download`,
                      }}
                    >
                      Download
                    </NavLink>
                  </Menu.Item>
                )}

                {selectedDataset &&
                  ["xrelease", "release", "project"].includes(
                    _.get(selectedDataset, "origin")
                  ) &&
                  hasData && (
                    <Menu.Item key="sourcemetrics">
                      <NavLink
                        to={{
                          pathname: `/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/sourcemetrics`,
                        }}
                      >
                        Sources
                      </NavLink>
                    </Menu.Item>
                  )}
                {_.isArray(_selectedKeys) &&
                  _selectedKeys.includes("source") &&
                  taxonOrNameKey && (
                    <Menu.Item key="source">Source: {taxonOrNameKey}</Menu.Item>
                  )}
                {selectedDataset &&
                  _.get(selectedDataset, "origin") === "project" &&
                  hasData && (
                    <Menu.Item key="released_from">
                      <NavLink
                        to={{
                          pathname: "/dataset",
                          search: `?releasedFrom=${selectedDataset.key}&sortBy=created`,
                        }}
                      >
                        Releases
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
                      Browse
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
                      Search
                    </NavLink>
                  </Menu.Item>
                )}
                {selectedDataset &&
                  !["xrelease", "release", "release", "project"].includes(
                    _.get(selectedDataset, "origin")
                  ) && (
                    <Menu.Item key="imports">
                      <NavLink
                        to={{
                          pathname: `/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/imports`,
                        }}
                      >
                        Imports
                      </NavLink>
                    </Menu.Item>
                  )}
                {selectedDataset &&
                  !selectedDataset.deleted &&
                  ["xrelease", "release"].includes(
                    _.get(selectedDataset, "origin")
                  ) && (
                    <Menu.Item key="release-metrics">
                      <NavLink
                        to={{
                          pathname: `/dataset/${_.get(
                            selectedDataset,
                            "key"
                          )}/release-metrics`,
                        }}
                      >
                        Metrics
                      </NavLink>
                    </Menu.Item>
                  )}
                {selectedDataset &&
                  !["xrelease", "release"].includes(
                    _.get(selectedDataset, "origin")
                  ) &&
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
                {selectedDataset && hasData && (
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
                {_.isArray(_selectedKeys) &&
                  _selectedKeys.includes("reference") &&
                  taxonOrNameKey && (
                    <Menu.Item key="reference">
                      Reference: {taxonOrNameKey}
                    </Menu.Item>
                  )}
                {selectedDataset &&
                  !["xrelease", "project", "release"].includes(
                    _.get(selectedDataset, "origin")
                  ) &&
                  selectedDataset.size && (
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

                {/*               {selectedDataset && (
                <Menu.Item key="projects">
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(
                        selectedDataset,
                        "key"
                      )}/projects`,
                    }}
                  >
                    Contributes
                  </NavLink>
                </Menu.Item>
              )} */}
                {_.isArray(_selectedKeys) &&
                  (_selectedKeys.includes("taxon") ||
                    _selectedKeys.includes("nameusage")) &&
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
  // recentDatasets,
  catalogueKey,
  dataset,
  sourceDataset,
  catalogue,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
}) => ({
  user,
  // recentDatasets,
  catalogueKey,
  dataset,
  sourceDataset,
  catalogue,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
});

export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
