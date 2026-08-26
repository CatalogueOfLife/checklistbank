import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";

import { BarsOutlined, SettingOutlined, SearchOutlined, ToolOutlined } from "@ant-design/icons";

import { Menu as AntdMenu, Badge } from "antd";
import Logo from "./Logo";
import _ from "lodash";
import Auth from "../Auth";
import withContext from "../hoc/withContext";

import SourceSelect from "./SourceDatasetSelect";
import { truncate } from "../util";
import { JOB_LANE } from "../../api/job";

const BasicMenu = (props) => {
  const {
    dataset: selectedDataset,
    sourceDataset,
    project,
    selectedSector,
    user,
    //   recentDatasets,
    taxonOrNameKey,
    projectKey,
    _selectedKeys,
    _openKeys,
    selectedKeys,
    openKeys,
    collapsed,
    setSelectedKeys,
    setOpenKeys,
    projectJobQueue,
  } = props;

  // Running and queued sector syncs of the open project. Replaces the old
  // sync-state widget: syncs are ordinary background jobs now, so this comes
  // off the same GET /job?datasetKey= poll as everything else.
  const syncCount = [
    ...(projectJobQueue?.running || []),
    ...(projectJobQueue?.queued || []),
  ].filter((j) => j.lane === JOB_LANE.SYNC).length;

  useEffect(() => {
    if (openKeys) {
      setOpenKeys([...new Set([...openKeys, ..._openKeys])]);
    }
    setSelectedKeys(selectedKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedKeys !== undefined) {
      setSelectedKeys(selectedKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedKeys)]);

  useEffect(() => {
    if (!collapsed && openKeys !== undefined) {
      setOpenKeys([...new Set([...openKeys, ..._openKeys])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(openKeys)]);

  const selectedDatasetIsProjectAndUserHasAccess = (project, dataset, user) => {
    return (
      (!dataset || project?.key === dataset?.key) &&
      Auth.canViewDataset(project, user)
    );
  };

  const onOpenChange = (openKeys) => {
    setOpenKeys(openKeys);
  };

  const onSelect = ({ item, key, selectedKeys }) => {
    setSelectedKeys(selectedKeys);
  };

  const isSourceDataset = (dataset) => {
    return (
      _.isArray(dataset.contributesTo) &&
      dataset.contributesTo.includes(projectKey)
    );
  };

  // `size` is the usage count recorded by the last import and can sit at a
  // stale 0 while the data is still there and served - GTDB (310495) reports
  // size 0 with 243k names in search and a classification tree that renders.
  // Gating the menu on `size` alone therefore hides pages that work, so a
  // dataset that has been imported at all (`attempt` is set) counts as having
  // data. `lastImportState` is deliberately not used: it flips to "running"
  // mid-import and the menu entries would disappear for the duration.
  //
  // The trade is that a dataset that really is empty still shows Browse and
  // renders an empty page, which is far less confusing than a working page
  // with no way to reach it.
  const datasetHasData = (d) =>
    !_.get(d, "deleted") &&
    (_.get(d, "size") ||
      _.get(d, "attempt") != null ||
      ["xrelease", "release", "project"].includes(_.get(d, "origin")));
  const hasDataset = datasetHasData(selectedDataset);
  const sourceHasData = datasetHasData(sourceDataset);

  const menuItems = [
    // About submenu
    {
      key: "about",
      label: (
        <span>
          <ToolOutlined />
          <span>About</span>
        </span>
      ),
      children: [
        {
          key: "introduction",
          label: (
            <NavLink to={{ pathname: "/about/introduction" }}>
              <span>Introduction</span>
            </NavLink>
          ),
        },
        {
          key: "contribute",
          label: (
            <NavLink to={{ pathname: "/about/contribute" }}>
              <span>Contribute</span>
            </NavLink>
          ),
        },
        {
          key: "formats",
          label: (
            <NavLink to={{ pathname: "/about/formats" }}>
              <span>Formats</span>
            </NavLink>
          ),
        },
        {
          key: "identifiers",
          label: (
            <NavLink to={{ pathname: "/about/identifiers" }}>
              <span>Identifiers</span>
            </NavLink>
          ),
        },
        {
          key: "DOI",
          label: (
            <NavLink to={{ pathname: "/about/DOI" }}>
              <span>DOI</span>
            </NavLink>
          ),
        },
        {
          key: "API",
          label: (
            <NavLink to={{ pathname: "/about/API" }}>
              <span>API</span>
            </NavLink>
          ),
        },
        {
          key: "reconciliation",
          label: (
            <NavLink to={{ pathname: "/about/reconciliation" }}>
              <span>Reconciliation</span>
            </NavLink>
          ),
        },
      ],
    },

    // Datasets
    {
      key: "/dataset",
      label: (
        <NavLink to="/dataset">
          <SearchOutlined />
          <span>Datasets</span>
        </NavLink>
      ),
    },

    // Tools submenu
    {
      key: "tools",
      label: (
        <span>
          <ToolOutlined />
          <span>Tools</span>
        </span>
      ),
      children: [
        {
          key: "nameUsageSearch",
          label: (
            <NavLink to={{ pathname: "/nameusage/search" }}>
              <span>Cross dataset search</span>
            </NavLink>
          ),
        },
        {
          key: "namematch",
          label: (
            <NavLink to={{ pathname: "/tools/name-match" }}>
              <span>Name matching</span>
            </NavLink>
          ),
        },
        {
          key: "nameparser",
          label: (
            <NavLink to={{ pathname: "/tools/name-parser" }}>
              <span>Name parser</span>
            </NavLink>
          ),
        },
        {
          key: "taxgroupparser",
          label: (
            <NavLink to={{ pathname: "/tools/taxgroup-parser" }}>
              <span>Taxon group parser</span>
            </NavLink>
          ),
        },
        Auth.isAuthorised(user, ["admin", "editor"]) && {
          key: "nameIndexSearch",
          label: (
            <NavLink to={{ pathname: "/namesindex" }}>
              <span>Names index search</span>
            </NavLink>
          ),
        },
        _.isArray(_selectedKeys) &&
          _selectedKeys.includes("nameIndexKey") &&
          taxonOrNameKey && {
            key: "nameIndexKey",
            label: `Nidx: ${taxonOrNameKey}`,
          },
        user && {
          key: "taxalign",
          label: (
            <NavLink to={{ pathname: "/tools/taxonomic-alignment" }}>
              <span>Taxonomic alignment</span>
            </NavLink>
          ),
        },
        user && {
          key: "datasetComparison",
          label: (
            <NavLink to={{ pathname: "/tools/dataset-comparison" }}>
              <span>Dataset comparison</span>
            </NavLink>
          ),
        },
        Auth.isAuthorised(user, ["admin", "editor"]) && {
          key: "diffviewer",
          label: (
            <NavLink to={{ pathname: "/tools/diff-viewer" }}>
              <span>Diff viewer</span>
            </NavLink>
          ),
        },
        Auth.isAuthorised(user, ["admin", "editor"]) && {
          key: "gbif-impact",
          label: (
            <NavLink to={{ pathname: "/tools/gbif-impact" }}>
              <span>GBIF impact</span>
            </NavLink>
          ),
        },
        {
          key: "metadatagenerator",
          label: (
            <NavLink to={{ pathname: "/tools/metadata-generator" }}>
              <span>Metadata generator</span>
            </NavLink>
          ),
        },
        user && {
          key: "validator",
          label: (
            <NavLink to={{ pathname: "/tools/validator" }}>
              <span>Archive validator</span>
            </NavLink>
          ),
        },
        {
          key: "vocabulary",
          label: (
            <NavLink to={{ pathname: "/vocabulary" }}>
              <span>Vocabularies</span>
            </NavLink>
          ),
        },
        !user && {
          key: "toolsIndex",
          label: (
            <NavLink to={{ pathname: "/tools/index" }}>
              <span>more ...</span>
            </NavLink>
          ),
        },
      ].filter(Boolean),
    },

    // Admin submenu
    Auth.isAuthorised(user, ["editor", "admin"]) && {
      key: "admin",
      label: (
        <span>
          <SettingOutlined />
          <span>Admin</span>
        </span>
      ),
      children: [
        {
          key: "backgroundJobs",
          label: (
            <NavLink to={{ pathname: "/jobs" }}>
              <span>Jobs</span>
            </NavLink>
          ),
        },
        ...(Auth.isAuthorised(user, ["admin"])
          ? [
              {
                key: "userAdmin",
                label: (
                  <NavLink to={{ pathname: "/admin/users" }}>
                    <span>Users</span>
                  </NavLink>
                ),
              },
              {
                key: "adminSettings",
                label: (
                  <NavLink to={{ pathname: "/admin/settings" }}>
                    <span>Settings</span>
                  </NavLink>
                ),
              },
              {
                key: "esAdmin",
                label: (
                  <NavLink to={{ pathname: "/admin/datasets" }}>
                    <span>Datasets</span>
                  </NavLink>
                ),
              },
              {
                key: "matcherAdmin",
                label: (
                  <NavLink to={{ pathname: "/admin/matcher" }}>
                    <span>Matcher</span>
                  </NavLink>
                ),
              },
            ]
          : []),
      ],
    },

    // Assembly (project) submenu
    selectedDatasetIsProjectAndUserHasAccess(project, selectedDataset, user) &&
      project && {
        key: "assembly",
        label: (
          <span>
            <BarsOutlined />
            <span>{project?.alias || `Project: ${project?.key}`}</span>
          </span>
        ),
        children: [
          {
            key: "projectMeta",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/metadata` }}>
                <span>Metadata</span>
              </NavLink>
            ),
          },
          {
            key: "colAssembly",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/assembly` }}>
                {Auth.canEditDataset({ key: projectKey }, user) ? (
                  <span>Assembly</span>
                ) : (
                  <span>Browse</span>
                )}
              </NavLink>
            ),
          },
          {
            key: "projectNameSearch",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/names` }}>
                <span>Search</span>
              </NavLink>
            ),
          },
          {
            key: "projectDownload",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/download` }}>
                Download
              </NavLink>
            ),
          },
          {
            key: "assemblyReferences",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/references` }}>
                <span>References</span>
              </NavLink>
            ),
          },
          {
            key: "projectSectors",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/sector` }}>
                {/* <PartitionOutlined /> */}
                <span>Sectors</span>
                {syncCount > 0 && (
                  <Badge
                    count={syncCount}
                    color="blue"
                    style={{ marginLeft: "6px" }}
                    title={`${syncCount} sector syncs running or queued`}
                  />
                )}
              </NavLink>
            ),
          },
          {
            key: "projectSources",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/sources` }}>
                {" "}
                {/*  <TableOutlined /> */}
                <span>Sources</span>
              </NavLink>
            ),
          },
          {
            key: "assemblyDuplicates",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/duplicates` }}>
                <span>Duplicates</span>
              </NavLink>
            ),
          },
          {
            key: "assemblyTasks",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/tasks` }}>
                <span>Tasks</span>
              </NavLink>
            ),
          },
          {
            key: "projectDecisions",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/decision` }}>
                {/*  <CheckOutlined /> */}
                <span>Decisions</span>
              </NavLink>
            ),
          },
          {
            key: "releases",
            label: (
              <NavLink
                to={{
                  pathname: "/dataset",
                  search: `?releasedFrom=${projectKey}`,
                }}
              >
                <span>Releases</span>
              </NavLink>
            ),
          },
          {
            key: "release-metrics",
            label: (
              <NavLink to={{ pathname: `/dataset/${projectKey}/imports` }}>
                <span>Release metrics</span>
              </NavLink>
            ),
          },
          Auth.canEditDataset({ key: projectKey }, user) && {
            key: "projectEditors",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/editors` }}>
                <span>Editors</span>
              </NavLink>
            ),
          },
          {
            key: "projectOptions",
            label: (
              <NavLink to={{ pathname: `/project/${projectKey}/options` }}>
                <span>Options</span>
              </NavLink>
            ),
          },
          selectedSector && {
            key: "sectorDiff",
            label: `Sector diff: ${selectedSector}`,
          },
          _selectedKeys &&
            _selectedKeys.includes("projectTaxon") &&
            taxonOrNameKey && {
              key: "projectTaxon",
              label: `Taxon: ${taxonOrNameKey}`,
            },
          _selectedKeys &&
            _selectedKeys.includes("projectName") &&
            taxonOrNameKey && {
              key: "projectName",
              label: `Name: ${taxonOrNameKey}`,
            },
          // Source dataset submenu
          {
            key: "sourceDataset",
            label: <span>Source</span>,
            children: [
              {
                type: "group",
                key: "sourceDatasetGroup",
                label: (
                  <>
                    <SourceSelect projectKey={projectKey} />{" "}
                    {sourceDataset
                      ? sourceDataset?.alias ||
                        truncate(sourceDataset?.title, 25)
                      : "Select"}
                  </>
                ),
                children: [
                  sourceDataset && {
                    key: "source_metadata",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/metadata`,
                        }}
                      >
                        Metadata
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_classification",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/classification`,
                        }}
                      >
                        Browse
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_workbench",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/workbench`,
                        }}
                      >
                        Workbench
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_references",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/references`,
                        }}
                      >
                        References
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_duplicates",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/duplicates`,
                        }}
                      >
                        Duplicates
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_tasks",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/tasks`,
                        }}
                      >
                        Tasks
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_sectors",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/sector`,
                          search: `?limit=100&offset=0&subjectDatasetKey=${sourceDataset?.key}`,
                        }}
                      >
                        Sectors
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_decisions",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/decision`,
                          search: `?limit=100&offset=0&subjectDatasetKey=${sourceDataset?.key}`,
                        }}
                      >
                        Decisions
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_issues",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/issues`,
                        }}
                      >
                        Issues
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_imports",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/imports`,
                        }}
                      >
                        Metrics
                      </NavLink>
                    ),
                  },
                  sourceDataset && {
                    key: "source_verbatim",
                    label: (
                      <NavLink
                        to={{
                          pathname: `/project/${projectKey}/dataset/${_.get(
                            sourceDataset,
                            "key"
                          )}/verbatim`,
                        }}
                      >
                        Verbatim
                      </NavLink>
                    ),
                  },
                  _.isArray(_selectedKeys) &&
                    _selectedKeys.includes("source_taxon") &&
                    taxonOrNameKey && {
                      key: "source_taxon",
                      label: `Taxon: ${taxonOrNameKey}`,
                    },
                  _.isArray(_selectedKeys) &&
                    _selectedKeys.includes("source_name") &&
                    taxonOrNameKey && {
                      key: "source_name",
                      label: `Name: ${taxonOrNameKey}`,
                    },
                ].filter(Boolean),
              },
            ],
          },
        ].filter(Boolean),
      },

    // Dataset submenu (non-project datasets)
    selectedDataset &&
      !selectedDatasetIsProjectAndUserHasAccess(
        project,
        selectedDataset,
        user
      ) && {
        key: "datasetKey",
        label: (
          <span>
            <BarsOutlined />
            <span>
              {selectedDataset.alias || `Dataset: ${selectedDataset.key}`}
            </span>
          </span>
        ),
        children: [
          {
            key: "metadata",
            label: (
              <NavLink
                to={{
                  pathname: `/dataset/${_.get(selectedDataset, "key")}/metadata`,
                }}
              >
                Metadata
              </NavLink>
            ),
          },
          selectedDataset && hasDataset && {
            key: "classification",
            label: (
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
            ),
          },
          selectedDataset && !selectedDataset.deleted && {
            key: "names",
            label: (
              <NavLink
                to={{
                  pathname: `/dataset/${_.get(selectedDataset, "key")}/names`,
                }}
              >
                Search
              </NavLink>
            ),
          },
          !selectedDataset.deleted && {
            key: "download",
            label: (
              <NavLink
                to={{
                  pathname: `/dataset/${_.get(selectedDataset, "key")}/download`,
                }}
              >
                Download
              </NavLink>
            ),
          },
          selectedDataset && hasDataset && {
            key: "references",
            label: (
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
            ),
          },
          selectedDataset &&
            ["xrelease", "release"].includes(
              _.get(selectedDataset, "origin")
            ) && {
              key: "sector",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${selectedDataset?.key}/sector`,
                  }}
                >
                  {/*  <CheckOutlined /> */}
                  <span>Sectors</span>
                </NavLink>
              ),
            },
          selectedDataset &&
            ["xrelease", "release", "project"].includes(
              _.get(selectedDataset, "origin")
            ) &&
            hasDataset && {
              key: "sourcemetrics",
              label: (
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
              ),
            },
          selectedDataset &&
            ["xrelease", "release"].includes(
              _.get(selectedDataset, "origin")
            ) && {
              key: "decisions",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${selectedDataset?.key}/decisions`,
                  }}
                >
                  {/*  <CheckOutlined /> */}
                  <span>Decisions</span>
                </NavLink>
              ),
            },
          Auth.canEditDataset(selectedDataset, user) &&
            !selectedDataset.deleted && {
              key: "datasetDuplicateSearch",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      selectedDataset,
                      "key"
                    )}/duplicates`,
                  }}
                >
                  Duplicates
                </NavLink>
              ),
            },
          Auth.canEditDataset(selectedDataset, user) &&
            !selectedDataset.deleted && {
              key: "datasetDuplicateTasks",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(
                      selectedDataset,
                      "key"
                    )}/duplicates/overview`,
                  }}
                >
                  Tasks
                </NavLink>
              ),
            },
          _.isArray(_selectedKeys) &&
            _selectedKeys.includes("source") &&
            taxonOrNameKey && {
              key: "source",
              label: `Source: ${taxonOrNameKey}`,
            },
          selectedDataset &&
            _.get(selectedDataset, "origin") === "project" &&
            hasDataset && {
              key: "released_from",
              label: (
                <NavLink
                  to={{
                    pathname: "/dataset",
                    search: `?releasedFrom=${selectedDataset.key}&sortBy=issued&reverse=false`,
                  }}
                >
                  Releases
                </NavLink>
              ),
            },
          selectedDataset &&
            /*  !["xrelease", "release"].includes(
              _.get(selectedDataset, "origin")
            ) && */
            hasDataset && {
              key: "issues",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(selectedDataset, "key")}/issues`,
                  }}
                >
                  Issues
                </NavLink>
              ),
            },
          selectedDataset &&
            !["xrelease", "release", "release", "project"].includes(
              _.get(selectedDataset, "origin")
            ) && {
              key: "imports",
              label: (
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
              ),
            },
          selectedDataset &&
            !selectedDataset.deleted &&
            ["xrelease", "release"].includes(
              _.get(selectedDataset, "origin")
            ) && {
              key: "release-metrics",
              label: (
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
              ),
            },
          _.isArray(_selectedKeys) &&
            _selectedKeys.includes("reference") &&
            taxonOrNameKey && {
              key: "reference",
              label: `Reference: ${taxonOrNameKey}`,
            },
          selectedDataset &&
            !["xrelease", "project", "release"].includes(
              _.get(selectedDataset, "origin")
            ) &&
            selectedDataset.size > 0 && {
              key: "verbatim",
              label: (
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
              ),
            },
          Auth.canEditDataset(selectedDataset, user) &&
            !["xrelease", "release"].includes(
              _.get(selectedDataset, "origin")
            ) && {
              key: "editors",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${selectedDataset?.key}/editors`,
                  }}
                >
                  <span>Editors</span>
                </NavLink>
              ),
            },
          Auth.canEditDataset(selectedDataset, user) &&
            !selectedDataset.deleted && {
              key: "options",
              label: (
                <NavLink
                  to={{
                    pathname: `/dataset/${_.get(selectedDataset, "key")}/options`,
                  }}
                >
                  Options
                </NavLink>
              ),
            },
          _.isArray(_selectedKeys) &&
            (_selectedKeys.includes("taxon") ||
              _selectedKeys.includes("nameusage")) &&
            taxonOrNameKey && {
              key: "taxon",
              label: `Taxon: ${taxonOrNameKey}`,
            },
          _.isArray(_selectedKeys) &&
            _selectedKeys.includes("name") &&
            taxonOrNameKey && {
              key: "name",
              label: `Name: ${taxonOrNameKey}`,
            },
        ].filter(Boolean),
      },
  ].filter(Boolean);

  return (
    <React.Fragment>
      <div className="logo">
        <NavLink
          to={{
            pathname: `/`,
          }}
          end
        >
          <Logo />
        </NavLink>
      </div>

      <AntdMenu
        items={menuItems}
        selectedKeys={_selectedKeys}
        openKeys={_openKeys}
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        // buffer so the last entry can be scrolled clear of the viewport edge
        style={{ paddingBottom: "64px" }}
      />
    </React.Fragment>
  );
};

const mapContextToProps = ({
  user,
  // recentDatasets,
  projectJobQueue,
  projectKey,
  dataset,
  sourceDataset,
  project,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
}) => ({
  user,
  // recentDatasets,
  projectJobQueue,
  projectKey,
  dataset,
  sourceDataset,
  project,
  _selectedKeys,
  _openKeys,
  setSelectedKeys,
  setOpenKeys,
});

export default withRouter(
  withContext(mapContextToProps)(BasicMenu)
);
