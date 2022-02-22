import React from "react";
import {
  //Tree,
  notification,
  message,
  Alert,
  Spin,
  Button,
  Skeleton,
} from "antd";
import Tree from "../../../components/tree/index";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../../../components/ErrorMsg";
import Custom404 from "./Custom404";
import { getSectorsBatch } from "../../../api/sector";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import { ColTreeContext } from "./ColTreeContext";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
import Auth from "../../../components/Auth";
const { canEditDataset } = Auth;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time
const IRREGULAR_RANKS = [
  "unranked",
  "other",
  "infraspecific name",
  "infrageneric name",
  "infrasubspecific name",
  "suprageneric name",
];

const TAXON_KEY_PARAMETER_NAMES = {
  CATALOGUE: "assemblyTaxonKey",
  SOURCE: "sourceTaxonKey",
  readOnly: "taxonKey",
};

class LoadMoreChildrenTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
  }

  onClick = () => {
    this.setState({ loading: true });
    this.props.onClick();
  };
  render = () => {
    const { loading } = this.state;
    return (
      <div>
        {loading && <Spin />}
        {!loading && (
          <a onClick={this.onClick}>
            <strong>Load more...</strong>
          </a>
        )}
      </div>
    );
  };
}

class ColTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rootLoading: true,
      treeData: [],
      loadedKeys: [],
      expandedKeys: [],
      selectedKeys: [],
      rootTotal: 0,
      error: null,
      mode: "attach",
      ranks: [],
      nodeNotFoundErr: null,
    };

    this.treeRef = React.createRef();
  }

  componentDidMount = () => {
    this.loadRoot();
    this.sectorLoader = new DataLoader((ids) =>
      getSectorsBatch(ids, this.props.catalogueKey)
    );
    const { treeRef } = this.props;
    treeRef(this);
  };

  componentDidUpdate = (prevProps) => {
    if (
      prevProps.dataset.key !== this.props.dataset.key ||
      prevProps.catalogueKey !== this.props.catalogueKey ||
      prevProps.insertPlaceholder !== this.props.insertPlaceholder
    ) {
      this.setState({ treeData: [], loadedKeys: [],
        expandedKeys: [],
        selectedKeys: [] }, this.loadRoot);
      this.sectorLoader = new DataLoader((ids) =>
        getSectorsBatch(ids, this.props.catalogueKey)
      );
    }
  };

  reloadRoot = () =>
    this.setState(
      {
        rootLoading: true,
        treeData: [],
        loadedKeys: [],
        rootTotal: 0,
        error: null,
        mode: "attach",
        nodeNotFoundErr: null,
      },
      this.loadRoot
    );

  loadRoot = async () => {
    const {
      treeType,
      dataset: { key },
      dataset,
      showSourceTaxon,
      catalogueKey,
      onDeleteSector,
      defaultExpandKey,
      insertPlaceholder = false
    } = this.props;
    this.setState({ rootLoading: true, treeData: [] });
    let id = key;
    return axios(
      `${
        config.dataApi
      }dataset/${id}/tree?catalogueKey=${catalogueKey}${this.appendTypeParam(
        treeType
      )}&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}&insertPlaceholder=${insertPlaceholder}`
    )
      .then(this.decorateWithSectorsAndDataset)
      .then((res) => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const treeData = mainTreeData.map((tx) => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            isLeaf: tx.childCount === 0,
            childOffset: 0,
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              dataset={dataset}
              confirmVisible={false}
              onDeleteSector={onDeleteSector}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={() => {
                const loadedChildIds = dataRef.children
                  ? dataRef.children
                      .filter((c) => c.children && c.children.length > 0)
                      .map((c) => c.key)
                  : null;
                return this.loadRoot().then(() =>
                  loadedChildIds
                    ? this.reloadLoadedKeys(loadedChildIds, false)
                    : false
                );
              }}
              reloadChildren={() => {
                return this.fetchChildPage(dataRef, true);
              }}
            />
          );
          dataRef.ref = dataRef;
          return dataRef;
        });

        this.setState(
          {
            rootTotal: rootTotal,
            rootLoading: false,
            treeData: [...this.state.treeData, ...treeData],
            expandedKeys:
              !defaultExpandKey && treeData.length < 10
                ? treeData.map((n) => n.taxon.id)
                : [],
            error: null,
          },
          () => {
            if (defaultExpandKey) {
              return this.expandToTaxon(defaultExpandKey);
            }
          }
        );
      })
      .catch((err) => {
        this.setState({
          treeData: [],
          rootLoading: false,
          expandedKeys: [],
          error: err,
        });
      });
  };
  appendTypeParam = (treeType) => {
    return treeType === "readOnly"
      ? `&type=CATALOGUE`
      : ["CATALOGUE", "SOURCE"].includes(treeType)
      ? `&type=${treeType}`
      : "";
  };
  expandToTaxon = async (defaultExpandKey) => {
    const {
      treeType,
      dataset: { key },
      dataset,
      showSourceTaxon,
      catalogueKey,
      onDeleteSector,
      insertPlaceholder = false,
    } = this.props;
    this.setState({ rootLoading: true });
    let id = key;
    const { data } = await axios(
      `${
        config.dataApi
      }dataset/${id}/tree/${encodeURIComponent(defaultExpandKey)}?catalogueKey=${catalogueKey}&insertPlaceholder=${insertPlaceholder}${this.appendTypeParam(
        treeType
      )}`
    )
      .then((res) => {
        if (treeType === "SOURCE") {
          for (let i = res.data.length - 2; i > -1; i--) {
            if (!res.data[i].sectorKey && res.data[i + 1].sectorKey) {
              res.data[i].sectorKey = res.data[i + 1].sectorKey;
            }
          }
          return res;
        } else if (treeType === "CATALOGUE" || treeType === "readOnly") {
          for (let i = res.data.length - 2; i > -1; i--) {
            if (
              res.data[i].sectorKey &&
              res.data[i].sectorKey !== res.data[i + 1].sectorKey
            ) {
              res.data[i].sectorRoot = true;
            }
          }
          return res;
        } else {
          return res;
        }
      })
      .then((res) =>
        this.decorateWithSectorsAndDataset({
          data: { result: res.data },
        }).then(() => res)
      );

    if (data.length === 0) {
      return this.setState(
        {
          error: {
            message: `No classification found for Taxon ID: ${defaultExpandKey}`,
          },
        },
        this.loadRoot_
      );
    }
    const tx = data[data.length - 1];
    let root = {
      taxon: tx,
      key: tx.id,
      datasetKey: id,
      childCount: tx.childCount,
      isLeaf: tx.childCount === 0,
      childOffset: 0,
    };
    root.title = (
      <ColTreeNode
        taxon={tx}
        dataset={dataset}
        onDeleteSector={onDeleteSector}
        confirmVisible={false}
        treeType={this.props.treeType}
        showSourceTaxon={showSourceTaxon}
        reloadSelfAndSiblings={() => {
          const loadedChildIds = root.children
            ? root.children
                .filter((c) => c.children && c.children.length > 0)
                .map((c) => c.key)
            : null;
          return this.loadRoot().then(() =>
            loadedChildIds
              ? this.reloadLoadedKeys(loadedChildIds, false)
              : false
          );
        }}
        reloadChildren={() => this.fetchChildPage(root, true)}
      />
    );

    const root_ = root;
    for (let i = data.length - 2; i >= 0; i--) {
      const tx = data[i];
      const node = {
        taxon: tx,
        key: tx.id,
        datasetKey: id,
        childCount: tx.childCount,
        isLeaf: tx.childCount === 0,
        childOffset: 0,
      };
      node.ref = node;
      node.title = (
        <ColTreeNode
          taxon={tx}
          dataset={dataset}
          onDeleteSector={onDeleteSector}
          confirmVisible={false}
          treeType={this.props.treeType}
          showSourceTaxon={showSourceTaxon}
          reloadSelfAndSiblings={() => {
            const loadedChildIds = root.children
              ? root.children
                  .filter((c) => c.children && c.children.length > 0)
                  .map((c) => c.key)
              : null;
            return this.fetchChildPage(root, true).then(() =>
              loadedChildIds
                ? this.reloadLoadedKeys(loadedChildIds, false)
                : false
            );
          }}
          reloadChildren={() => this.fetchChildPage(node, true)}
        />
      );

      root.children = [node];
      root = node;
    }

    const { treeData } = this.state;
    var rootIndex = treeData.findIndex((x) => x.key == root_.key);
    treeData[rootIndex] = root_;

    const loadedKeys = [...data.map((t) => t.id).reverse()];

    this.setState({ treeData, rootLoading: false }, () =>
      this.reloadLoadedKeys(loadedKeys)
    );
  };
  fetchChildPage = async (dataRef, reloadAll, dontUpdateState) => {
    const {
      showSourceTaxon,
      dataset,
      treeType,
      catalogueKey,
      onDeleteSector,
      insertPlaceholder = false,
    } = this.props;
    const { treeData } = this.state;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");

    const res = await axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${
        encodeURIComponent(dataRef.taxon.id) //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=${insertPlaceholder}&catalogueKey=${catalogueKey}${this.appendTypeParam(
        treeType
      )}`
    );

    let resWithSectorKeys;

    if (
      _.get(res, "data.empty") !== true &&
      treeType === "SOURCE" &&
      _.get(dataRef, "taxon.sectorKey")
    ) {
      // If it is a source and the parent has a sectorKey, copy it to children
      resWithSectorKeys = {
        ...res,
        data: {
          ...res.data,
          result: res.data.result.map((r) => ({
            sectorKey: _.get(dataRef, "taxon.sectorKey"),
            ...r,
          })),
        },
      };
    } else if (
      _.get(res, "data.empty") !== true &&
      (treeType === "CATALOGUE" || treeType === "readOnly") &&
      _.get(dataRef, "taxon.sectorKey")
    ) {
      // If it is a source and the parent has a sectorKey, copy it to children
      resWithSectorKeys = {
        ...res,
        data: {
          ...res.data,
          result: res.data.result.map((r) => ({
            isRootSector:
              _.get(r, "sectorKey") &&
              _.get(r, "sectorKey") !== _.get(dataRef, "taxon.sectorKey"),
            ...r,
          })),
        },
      };
    } else {
      resWithSectorKeys = res;
    }
    let decoratedRes = await this.decorateWithSectorsAndDataset(
      resWithSectorKeys
    );
    const data = decoratedRes.data.result
      ? decoratedRes.data.result.map((tx) => {
          let childDataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: dataset.key,
            childCount: tx.childCount,
            isLeaf: tx.childCount === 0,
            childOffset: 0,
            parent: dataRef,
            name: tx.name,
          };

          childDataRef.title = (
            <ColTreeNode
              confirmVisible={false}
              taxon={tx}
              dataset={dataset}
              onDeleteSector={onDeleteSector}
              treeType={this.props.treeType}
              reloadSelfAndSiblings={() => {
                const loadedChildIds = dataRef.children
                  ? dataRef.children
                      .filter((c) => c.children && c.children.length > 0)
                      .map((c) => c.key)
                  : null;
                return this.fetchChildPage(dataRef, true).then(() =>
                  loadedChildIds
                    ? this.reloadLoadedKeys(loadedChildIds, false)
                    : false
                );
              }}
              reloadChildren={() => this.fetchChildPage(childDataRef, true)}
              showSourceTaxon={showSourceTaxon}
            />
          );
          childDataRef.ref = childDataRef;

          return childDataRef;
        })
      : [];

    // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
    dataRef.children =
      dataRef.children && offset !== 0 && !reloadAll
        ? [...dataRef.children, ...data]
        : data;
    dataRef.isLeaf = !dataRef.children || dataRef.children.length === 0;
    dataRef.taxon.firstChildRank = _.get(dataRef, "children[0].taxon.rank");
    if (!decoratedRes.data.last) {
      const loadMoreFn = () => {
        dataRef.childOffset += CHILD_PAGE_SIZE;
        if (
          dataRef.children[dataRef.children.length - 1].key ===
          "__loadMoreBTN__"
        ) {
          dataRef.children = dataRef.children.slice(0, -1);
        }
        this.setState(
          {
            treeData: [...treeData],
            defaultExpandAll: false,
          },
          () => {
            this.fetchChildPage(dataRef, false);
          }
        );
      };
      dataRef.children = [
        ...dataRef.children,
        {
          title: (
            <LoadMoreChildrenTreeNode
              onClick={loadMoreFn}
              key="__loadMoreBTN__"
            />
          ),
          key: "__loadMoreBTN__",
          childCount: 0,
          isLeaf: true,
        },
      ];
    }
    if (!dontUpdateState) {
      this.setState({
        treeData: [...treeData],
        loadedKeys: [...new Set([...this.state.loadedKeys, dataRef.key])],
      });
    }
  };
  /*  fetchChildPage = (dataRef, reloadAll, dontUpdateState) => {
    const {
      showSourceTaxon,
      dataset,
      treeType,
      catalogueKey,
      onDeleteSector,
    } = this.props;
    const { treeData } = this.state;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");

    return axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${catalogueKey}${this.appendTypeParam(
        treeType
      )}`
    )
      .then((res) => {
        if (
          _.get(res, "data.empty") !== true &&
          treeType === "SOURCE" &&
          _.get(dataRef, "taxon.sectorKey")
        ) {
          // If it is a source and the parent has a sectorKey, copy it to children
          return {
            ...res,
            data: {
              ...res.data,
              result: res.data.result.map((r) => ({
                sectorKey: _.get(dataRef, "taxon.sectorKey"),
                ...r,
              })),
            },
          };
        } else if (
          _.get(res, "data.empty") !== true &&
          (treeType === "CATALOGUE" || treeType === "readOnly") &&
          _.get(dataRef, "taxon.sectorKey")
        ) {
          // If it is a source and the parent has a sectorKey, copy it to children
          return {
            ...res,
            data: {
              ...res.data,
              result: res.data.result.map((r) => ({
                isRootSector:
                  _.get(r, "sectorKey") &&
                  _.get(r, "sectorKey") !== _.get(dataRef, "taxon.sectorKey"),
                ...r,
              })),
            },
          };
        } else {
          return res;
        }
      })
      .then(this.decorateWithSectorsAndDataset)
      .then((res) =>
        res.data.result
          ? res.data.result.map((tx) => {
              let childDataRef = {
                taxon: tx,
                key: tx.id,
                datasetKey: dataset.key,
                childCount: tx.childCount,
                isLeaf: tx.childCount === 0,
                childOffset: 0,
                parent: dataRef,
                name: tx.name,
              };

              childDataRef.title = (
                <ColTreeNode
                  confirmVisible={false}
                  taxon={tx}
                  datasetKey={dataset.key}
                  onDeleteSector={onDeleteSector}
                  treeType={this.props.treeType}
                  reloadSelfAndSiblings={() => {
                    const loadedChildIds = dataRef.children
                      ? dataRef.children
                          .filter((c) => c.children && c.children.length > 0)
                          .map((c) => c.key)
                      : null;
                    return this.fetchChildPage(dataRef, true).then(() =>
                      loadedChildIds
                        ? this.reloadLoadedKeys(loadedChildIds, false)
                        : false
                    );
                  }}
                  reloadChildren={() => this.fetchChildPage(childDataRef, true)}
                  showSourceTaxon={showSourceTaxon}
                />
              );
              childDataRef.ref = childDataRef;

              return childDataRef;
            })
          : []
      )
      .then((data) => {
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;
        dataRef.isLeaf = !dataRef.children || dataRef.children.length === 0;
        dataRef.taxon.firstChildRank = _.get(dataRef, "children[0].taxon.rank");
        if (offset + CHILD_PAGE_SIZE < childcount) {
          const loadMoreFn = () => {
            dataRef.childOffset += CHILD_PAGE_SIZE;
            if (
              dataRef.children[dataRef.children.length - 1].key ===
              "__loadMoreBTN__"
            ) {
              dataRef.children = dataRef.children.slice(0, -1);
            }
            this.setState(
              {
                treeData: [...treeData],
                defaultExpandAll: false,
              },
              () => {
                this.fetchChildPage(dataRef, false);
              }
            );
          };
          dataRef.children = [
            ...dataRef.children,
            {
              title: (
                <LoadMoreChildrenTreeNode
                  onClick={loadMoreFn}
                  key="__loadMoreBTN__"
                />
              ),
              key: "__loadMoreBTN__",
              childCount: 0,
              isLeaf: true,
            },
          ];
        }
        if (!dontUpdateState) {
          this.setState({
            treeData: [...treeData],
            loadedKeys: [...new Set([...this.state.loadedKeys, dataRef.key])],
          });
        }
      });
  }; */

  decorateWithSectorsAndDataset = (res) => {
    if (!res.data.result) return res;
    const { catalogueKey } = this.props;
    return Promise.allSettled(
      res.data.result
        .filter((tx) => !!tx.sectorKey)
        .map((tx) =>
          this.sectorLoader.load(tx.sectorKey, catalogueKey).then((r) => {
            if (!r) {
              return this.setState({
                error: { message: `Sector ${tx.sectorKey} was not found` },
              });
            } else {
              tx.sector = r;
              return datasetLoader
                .load(r.subjectDatasetKey)
                .then((dataset) => (tx.sector.dataset = dataset));
            }
          })
        )
    ).then(() => res);
  };

  onLoadData = (treeNode, reloadAll = false) => {
    if (reloadAll) {
      treeNode.childOffset = 0;
    }
    return this.fetchChildPage(treeNode.ref, reloadAll);
  };

  findNode = (id, nodeArray, findByName) => {
    let node = null;

    node = nodeArray.find((n) =>
      !findByName ? _.get(n, "taxon.id") === id : _.get(n, "taxon.name") === id
    );

    if (node) {
      return node;
    } else {
      const children = nodeArray.map((n) => _.get(n, "children") || []);
      const flattenedChildren = _.flatten(children); // children.flat(); - doesn´t work in oler browsers
      if (flattenedChildren.length === 0) {
        return null;
      } else {
        return this.findNode(id, flattenedChildren, findByName);
      }
    }
  };

  pageThroughChildrenUntilTaxonFound = async (parentNode, taxonId) => {
    let node;
    while (!node && parentNode.children.length < parentNode.childCount) {
      parentNode.childOffset += CHILD_PAGE_SIZE;
      if (
        parentNode.children[parentNode.children.length - 1].key ===
        "__loadMoreBTN__"
      ) {
        parentNode.children = parentNode.children.slice(0, -1);
      }
      await this.fetchChildPage(parentNode, false, true);
      node = this.findNode(taxonId, parentNode.children);
    }
    if (!node) {
      node = parentNode.children.find((c) =>
        _.get(c, "taxon.id") ? c.taxon.id.indexOf("incertae-sedis") > -1 : false
      );
    }
    return node;
  };

  reloadLoadedKeys = async (keys, expandAll = true) => {
    this.setState({ rootLoading: true });
    const { loadedKeys: storedKeys } = this.state;
    const { defaultExpandKey } = this.props;

    let { treeData } = this.state;
    const targetTaxon = defaultExpandKey
      ? this.findNode(defaultExpandKey, treeData)
      : null;
    const loadedKeys = keys ? [...keys] : [...storedKeys];
    for (let index = 0; index < loadedKeys.length; index++) {
      let node = this.findNode(loadedKeys[index], treeData);
      if (!node && targetTaxon && loadedKeys[index - 1]) {
        // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node
        const parentNode = this.findNode(loadedKeys[index - 1], treeData);
        if (
          parentNode &&
          _.isArray(_.get(parentNode, "children")) &&
          parentNode.children.length > 0
        ) {
          node = await this.pageThroughChildrenUntilTaxonFound(
            parentNode,
            loadedKeys[index]
          );
          if (node) {
            loadedKeys.splice(index, 0, node.taxon.id);
          } else {
            // It has gone missing from the tree
            this.setState(
              {
                nodeNotFoundErr: (
                  <span>
                    Cannot find taxon {defaultExpandKey} in tree &#128549;
                  </span>
                ),
                rootLoading: false,
              },
              () => {
                if (
                  this.props.treeType === "CATALOGUE" &&
                  typeof this.props.addMissingTargetKey === "function"
                ) {
                  this.props.addMissingTargetKey(defaultExpandKey);
                }
              }
            );
          }
        }
      }
      if (node) {
        await this.fetchChildPage(node, true, true);
        let targetNode = node.children.find(
          (c) => _.get(c, "taxon.id") === _.get(targetTaxon, "taxon.id")
        );
        if (
          targetTaxon &&
          index === loadedKeys.length - 2 &&
          _.get(node, "taxon.id") !== _.get(targetTaxon, "taxon.id") &&
          _.isArray(node.children) &&
          !targetNode
        ) {
          if (node.children.length < node.childCount) {
            // its the parent of the taxon we are after - if its not in the first page, insert it
            // its the parent of the taxon we are after - if its not in the first page, insert it
            targetNode = await this.pageThroughChildrenUntilTaxonFound(
              node,
              _.get(targetTaxon, "taxon.id")
            );
            // node.children = [targetTaxon, ...node.children];
            if (targetNode) {
              this.setState({ treeData: [...this.state.treeData] }, () => {
                setTimeout(() => {
                  if (_.get(this, "treeRef.current")) {
                    this.treeRef.current.scrollTo({
                      key: this.props.defaultExpandKey,
                    });
                  }
                }, 100);
              });
            } else {
              // It has gone missing from the tree
              this.setState(
                {
                  nodeNotFoundErr: (
                    <span>
                      Cannot find taxon {defaultExpandKey} in tree &#128549;
                    </span>
                  ),
                },
                () => {
                  if (
                    this.props.treeType === "CATALOGUE" &&
                    typeof this.props.addMissingTargetKey === "function"
                  ) {
                    this.props.addMissingTargetKey(defaultExpandKey);
                  }
                }
              );
            }
            /*  this.setState({ treeData: [...this.state.treeData] }, () => {
              setTimeout(() => {
                if (_.get(this, "treeRef.current")) {
                  this.treeRef.current.scrollTo({
                    key: this.props.defaultExpandKey,
                  });
                }
              }, 100);
            }); */
          }
        } else {
          const treeRef = _.get(this, "treeRef");
          setTimeout(() => {
            if (_.get(treeRef, "current")) {
              treeRef.current.scrollTo({ key: this.props.defaultExpandKey });
            }
          }, 100);
        }
      }
    }
    const newState = { loadedKeys, rootLoading: false };
    if (expandAll) {
      newState.expandedKeys = loadedKeys;
    }
    this.setState(newState, () => {
      if (defaultExpandKey) {
        setTimeout(() => {
          if (_.get(this, "treeRef.current")) {
            this.treeRef.current.scrollTo({ key: this.props.defaultExpandKey });
          }
        }, 100);
      }
    });
  };

  confirmAttach = (node, dragNode, mode) => {
    const { attachFn } = this.props;
    /*
       This is where sector mapping should be posted to the server
       */
    node.title = React.cloneElement(node.title, { isUpdating: true });

    this.setState({ treeData: [...this.state.treeData] });
    attachFn(node, dragNode, mode).then((res) => {
      dragNode.title.props.reloadSelfAndSiblings();
      node.title.props
        .reloadSelfAndSiblings()
        .then(() => {
          const children =
            _.get(node, "parent.children") || this.state.treeData;
          const newNodeReference =
            mode === "REPLACE"
              ? this.findNode(dragNode.taxon.name, children, true)
              : this.findNode(node.taxon.id, children);
          this.fetchChildPage(newNodeReference, true).then(
            () =>
              (node.title = React.cloneElement(node.title, {
                isUpdating: false,
              }))
          );
        })
        .catch((err) => {
          console.log(err);
          alert(err);
        });
      //  .catch((err)=> alert(err));
    });
  };

  confirmMultiAttach = (node, dragNodes) => {
    const { attachFn } = this.props;
    /*
       This is where sector mapping should be posted to the server
       */
    node.title = React.cloneElement(node.title, { isUpdating: true });

    this.setState({ treeData: [...this.state.treeData] });
    Promise.allSettled(
      dragNodes.map((dragNode) => attachFn(node, dragNode, "ATTACH"))
    ).then((res) => {
      const errors = res.filter((r) => r.status === "rejected");
      if (errors.length > 0) {
        alert(
          `There were ${errors.length} errors out of ${dragNodes.length} attachments. Please reload trees and inspect carefully.`
        );
      }
      dragNodes.forEach((dragNode) =>
        dragNode.title.props.reloadSelfAndSiblings()
      );
      node.title.props
        .reloadSelfAndSiblings()
        .then(() => {
          const newNodeReference = node?.parent?.children ? this.findNode(
            node.taxon.id,
            node.parent.children
          ) : node.taxon;
          this.fetchChildPage(newNodeReference, true).then(
            () =>
              (node.title = React.cloneElement(node.title, {
                isUpdating: false,
              }))
          );
        })
        .catch((err) => {
          console.log(err);
          alert(err);
        });
      //  .catch((err)=> alert(err));
    });
  };

  replaceSectorTarget = (node, dragNode) => {
    const {
      taxon: { sector },
    } = dragNode;
    const target = {
      id: _.get(node, "taxon.id"),
      name: _.get(node, "taxon.name"),
      rank: _.get(node, "taxon.rank"),
      status: _.get(node, "taxon.status"),
      parent: _.get(node, "taxon.parentId"),
    };
    const {
      datasetKey,
      id,
      mode,
      originalSubjectId,
      subjectDatasetKey,
      subject,
    } = sector;
    const updatedSector = {
      datasetKey,
      id,
      mode,
      originalSubjectId,
      subjectDatasetKey,
      subject,
      target,
    };
    return axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        updatedSector
      )
      .then((res) => {
        dragNode.title.props.reloadSelfAndSiblings();
        node.title.props
          .reloadSelfAndSiblings()
          .then(() => {
            const children =
              _.get(node, "parent.children") || this.state.treeData;
            const newNodeReference = this.findNode(node.taxon.id, children);
            this.fetchChildPage(newNodeReference, true).then(
              () =>
                (node.title = React.cloneElement(node.title, {
                  isUpdating: false,
                }))
            );
            notification.open({
              message: `Sector target updated`,
            });
          })
          .catch((err) => {
            console.log(err);
            alert(err);
          });
        //  .catch((err)=> alert(err));
      });
  };

  handleAttach = (e) => {
    const { rank } = this.props;
    const dragNode = this.props.dragNode.ref;
    const { selectedSourceTreeNodes } = this.props;
    // Group draggednodes by taxon rank
    const rankGroupedSelectedNodes = _.groupBy(
      selectedSourceTreeNodes,
      (n) => n.taxon.rank
    );
    const draggedNodeRanksAreMixed =
      Object.keys(rankGroupedSelectedNodes).length > 1;
    // Pick only nodes of the highest rank among dragged nodes
    const sortedDraggedRanks = Object.keys(rankGroupedSelectedNodes).sort(
      (a, b) => rank.indexOf(a) <= rank.indexOf(b)
    );
    const highestDraggedRank = sortedDraggedRanks[0];
    const selectedNodesOfSameRanksAsDragnode =
      selectedSourceTreeNodes.length === 0
        ? []
        : rankGroupedSelectedNodes[highestDraggedRank].filter(
            (n) =>
              n.taxon.id.indexOf("incertae-sedis") === -1 &&
              n.taxon.id !== dragNode.taxon.id
          );
    // Only do multiselect if the dragged taxon is actually among selected nodes
    const taxonIsInSelectedNodes = selectedSourceTreeNodes.find(
      (n) => n.taxon.id === dragNode.taxon.id
    );

    const { node } = e;

    const dragNodeIsPlaceholder =
      dragNode.taxon.id.indexOf("incertae-sedis") > -1;
    const nodeIsPlaceholder = node.taxon.id.indexOf("incertae-sedis") > -1;
    const willProduceDuplicateChild =
      node.children && !dragNodeIsPlaceholder
        ? node.children.find((c) => c.taxon.name === dragNode.taxon.name)
        : false;
    const taxonNameIsEqual = dragNode.taxon.name === node.taxon.name;
    const dragNodeIsAlreadySectorSubject =
      _.get(dragNode, "taxon.sector") &&
      _.get(dragNode, "taxon.id") ===
        _.get(dragNode, "taxon.sector.subject.id");

    if (dragNode.taxon.datasetKey === node.taxon.datasetKey) {
      message.warn("You cannot modify the Tree in attachment mode");
      return; // we are in modify mode and should not react to the event
    }
    if (nodeIsPlaceholder) {
      message.warn("You cannot create sectors on placeholder nodes");
      return;
    }
    /*     if (
      _.get(dragNode, "taxon.sector") &&
      _.get(dragNode, "taxon.id") ===
        _.get(dragNode, "taxon.sector.subject.id")
    ) {
      message.warn(
        `Only one sector can be configured for each taxon. ${_.get(
          dragNode,
          "taxon.sector.subject.name"
        )} -> ${_.get(
          dragNode,
          "taxon.sector.target.name"
        )} is already defined as a sector `,
        6
      );
      return; // we are in modify mode and should not react to the event
    } */

    const showRankWarning =
      !IRREGULAR_RANKS.includes(node.taxon.rank) &&
      !IRREGULAR_RANKS.includes(dragNode.taxon.rank) &&
      rank.indexOf(dragNode.taxon.rank) < rank.indexOf(node.taxon.rank);

    // default to attach mode
    let mode = "ATTACH";

    if (dragNode.taxon.rank === node.taxon.rank) {
      mode = "UNION";
    }
    if (dragNodeIsPlaceholder) {
      mode = "UNION";
    }
    let msg;
    if (mode === "ATTACH") {
      msg = (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
          Attach{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: dragNode.taxon.name,
            }}
          />{" "}
          from {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: node.taxon.name,
            }}
          />{" "}
          in this project?
          <br />
          You may also choose to UNION.
          {willProduceDuplicateChild && (
            <Alert
              style={{ marginTop: "6px" }}
              type="error"
              message={
                <div>
                  <span dangerouslySetInnerHTML={{ __html: node.taxon.name }} />{" "}
                  already has a child named{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: dragNode.taxon.name }}
                  />
                </div>
              }
            />
          )}
        </span>
      );
    } else {
      msg = (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
          {dragNodeIsPlaceholder
            ? `Insert all taxa with no ${dragNode.taxon.rank} assigned `
            : `Ranks are equal. Do you want to ${
                taxonNameIsEqual && node?.taxon?.parentId ? "replace or " : ""
              }union children of `}
          {!dragNodeIsPlaceholder && (
            <span
              dangerouslySetInnerHTML={{
                __html: dragNode.taxon.name,
              }}
            />
          )}{" "}
          in {dragNode.dataset.title} into children of{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.taxon.name,
            }}
          />{" "}
        </span>
      );
    }

    if (
      selectedNodesOfSameRanksAsDragnode.length > 0 &&
      taxonIsInSelectedNodes
    ) {
      const limit = 10;
      const taxa = [dragNode, ...selectedNodesOfSameRanksAsDragnode];
      msg = (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
          {draggedNodeRanksAreMixed && (
            <Alert
              message={`You selected nodes of ${
                sortedDraggedRanks.length
              } different ranks! Only ${
                rankGroupedSelectedNodes[highestDraggedRank].length
              } taxa of rank ${highestDraggedRank} will be attached. Ignoring ${sortedDraggedRanks
                .slice(1)
                .map((e) => `${e} (${rankGroupedSelectedNodes[e].length}) `)
                .join(", ")}`}
              type="warning"
            />
          )}
          Attach{" "}
          <ul>
            {taxa.slice(0, limit).map((t) => (
              <li
                dangerouslySetInnerHTML={{
                  __html: t.taxon.name,
                }}
              />
            ))}
          </ul>
          {taxa.length > limit && ` and ${taxa.length - limit} more taxa `} from{" "}
          {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: node.taxon.name,
            }}
          />{" "}
          in this project?
          <br />
          {willProduceDuplicateChild && (
            <Alert
              style={{ marginTop: "6px" }}
              type="error"
              message={
                <div>
                  <span dangerouslySetInnerHTML={{ __html: node.taxon.name }} />{" "}
                  already has a child named{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: dragNode.taxon.name }}
                  />
                </div>
              }
            />
          )}
        </span>
      );
    }

    if (dragNodeIsAlreadySectorSubject) {
      msg = (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
          Replace sector target?
          <br />
          {willProduceDuplicateChild && (
            <Alert
              style={{ marginTop: "6px" }}
              type="error"
              message={
                <div>
                  <span dangerouslySetInnerHTML={{ __html: node.taxon.name }} />{" "}
                  already has a child named{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: dragNode.taxon.name }}
                  />
                </div>
              }
            />
          )}
        </span>
      );
    }

    const unionOptions = dragNodeIsPlaceholder
      ? [
          {
            text: "Union",
            action: () => this.confirmAttach(node, dragNode, "UNION"),
          },
        ]
      : taxonNameIsEqual
      ? [
          {
            text: "Attach",
            type: "dashed",
            action: () => this.confirmAttach(node, dragNode, "ATTACH"),
          },
          {
            text: "Replace",
            type: "danger",
            disabled: !node?.taxon?.parentId,
            action: () => this.confirmAttach(node, dragNode, "REPLACE"),
          },

          {
            text: "Union",
            type: "primary",
            action: () => this.confirmAttach(node, dragNode, "UNION"),
          },
        ]
      : [
          {
            text: "Attach",
            type: "dashed",
            action: () => this.confirmAttach(e.node, dragNode, "ATTACH"),
          },
          {
            text: "Union",
            type: "primary",
            action: () => this.confirmAttach(node, dragNode, "UNION"),
          },
        ];

    let actions = [];
    if (
      selectedNodesOfSameRanksAsDragnode.length > 0 &&
      taxonIsInSelectedNodes
    ) {
      actions = [
        {
          text: "Attach",
          type: "primary",
          action: () =>
            this.confirmMultiAttach(node, [
              dragNode,
              ...selectedNodesOfSameRanksAsDragnode,
            ]),
        },
      ];
    } else if (dragNodeIsAlreadySectorSubject) {
      actions = [
        {
          text: "Replace target",
          type: "primary",
          action: () => this.replaceSectorTarget(node, dragNode),
        },
      ];
    } else if (mode === "ATTACH") {
      actions = [
        {
          text: "Union",
          type: "dashed",
          action: () => this.confirmAttach(node, dragNode, "UNION"),
        },
        {
          text: "Attach",
          type: "primary",
          action: () => this.confirmAttach(node, dragNode, "ATTACH"),
        },
      ];
    } else {
      actions = unionOptions;
    }

    const nodeTitle = React.cloneElement(node.ref.title);
    node.ref.title = React.cloneElement(node.ref.title, {
      confirmVisible: true,
      confirmTitle: msg,
      actions: actions,
      onCancel: () => {
        node.ref.title = nodeTitle;
        this.setState({ treeData: [...this.state.treeData] });
      },
    });

    console.log(
      dragNode.title.props.taxon.name +
        " --> " +
        node.ref.title.props.taxon.name
    );
    this.setState({ treeData: [...this.state.treeData] });
  };

  confirmModify = (e, nodeTitle) => {
    const dragNode = this.props.dragNode.ref;
    const node = e.node.ref;
    const parent = e.node.ref.taxon;
    const draggedTaxon = e.dragNode.ref.taxon;
    axios(
      `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${draggedTaxon.id}`
    )
      .then((res) => res.data)
      .then((draggedTaxon) =>
        axios.put(
          `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${draggedTaxon.id}`,
          { ...draggedTaxon, parentId: parent.id }
        )
      )
      .then((res) => {
        _.remove(dragNode.parent.children, function (n) {
          return n.key === dragNode.key;
        });
        dragNode.parent.childCount--;
        dragNode.parent.isLeaf = dragNode.parent.childCount === 0;
        node.title.props.reloadChildren().then(() => {
          node.childCount++;
          node.isLeaf = node.childCount === 0;
        });

        const oldParentName = dragNode.parent.taxon.name;
        dragNode.parent = node;
        node.title = nodeTitle;
        let msg = (
          <span>
            You moved{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: dragNode.name,
              }}
            />{" "}
            from parent{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: oldParentName,
              }}
            />{" "}
            to parent{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: node.taxon.name,
              }}
            />
          </span>
        );
        this.setState(
          {
            treeData: [...this.state.treeData],
            defaultExpandAll: false,
          },
          () => {
            notification.open({
              message: "Taxon moved",
              description: msg,
            });
          }
        );
      })
      .catch((err) => {
        alert(err);
      });
  };
  handleModify = (e) => {
    if (e.dragNode.name === "Not assigned") {
      message.warn("You cannot move placeholder nodes");
      return;
    }

    const msg = (
      <span>
        Move <span dangerouslySetInnerHTML={{ __html: e.dragNode.name }} /> from
        parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.dragNode.parent.title.props.taxon.name,
          }}
        />{" "}
        to parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.node.ref.title.props.taxon.name,
          }}
        />
        ?
      </span>
    );
    const nodeTitle = React.cloneElement(e.node.ref.title);
    e.node.ref.title = React.cloneElement(e.node.ref.title, {
      confirmVisible: true,
      confirmTitle: msg,
      onConfirm: () => {
        this.confirmModify(e, nodeTitle);
      },
      onCancel: () => {
        e.node.ref.title = nodeTitle;
      },
    });
    this.setState({ treeData: [...this.state.treeData] });
  };
  handleDrop = (e, mode) => {
    const { treeType } = this.props;
    if (treeType !== "CATALOGUE") {
      return;
    }
    if (mode === "attach") {
      this.handleAttach(e);
    } else if (mode === "modify") {
      this.handleModify(e);
    }
  };

  render() {
    const {
      error,
      rootTotal,
      rootLoading,
      treeData,
      defaultExpandAll,
      nodeNotFoundErr,
      loadedKeys,
      expandedKeys,
      selectedKeys,
    } = this.state;
    const {
      draggable,
      onDragStart,
      location,
      treeType,
      dataset,
      defaultExpandKey,
      user,
    } = this.props;
    return (
      <React.Fragment>
        {error && (
          <React.Fragment>
            {_.get(error, "response.data.code") !== 404 ? (
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                style={{ marginTop: "8px" }}
                message={<ErrorMsg error={error} />}
                type="error"
              />
            ) : (
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                style={{ marginTop: "8px" }}
                message={
                  <Custom404
                    error={error}
                    treeType={treeType}
                    dataset={dataset}
                    loadRoot={this.loadRoot}
                  />
                }
                type="warning"
              />
            )}
          </React.Fragment>
        )}
        {nodeNotFoundErr && (
          <Alert
            closable
            onClose={() => this.setState({ ernodeNotFoundErrror: null })}
            style={{ marginTop: "8px" }}
            message={nodeNotFoundErr}
            type="warning"
          />
        )}
        {rootLoading && <Skeleton paragraph={{ rows: 10 }} active />}
        {!rootLoading && treeData.length > 0 && (
          <ColTreeContext.Consumer>
            {({ mode }) => (
              <Tree.DirectoryTree
                expandAction={false}
                ref={this.treeRef}
                height={this.props.height || 800}
                // showLine={{showLeafIcon: false}}
                showIcon={false}
                defaultExpandAll={defaultExpandAll}
                // defaultExpandedKeys={defaultExpandedKeys}
                draggable={draggable}
                onDrop={(e) => this.handleDrop(e, mode)}
                onDragStart={onDragStart}
                loadData={this.onLoadData}
                onLoad={(loadedKeys) => this.setState({ loadedKeys })}
                loadedKeys={loadedKeys}
                expandedKeys={expandedKeys}
                multiple
                treeData={treeData}
                selectedKeys={treeType !== "readOnly" ? selectedKeys : []}
                selectable={treeType !== "readOnly"}
                onSelect={(selectedKeys, e) => {
                  this.setState({ selectedKeys: selectedKeys });
                  this.setState({ selectedNodes: e.selectedNodes });
                }}
                filterTreeNode={(node) => {
                  return node.key === defaultExpandKey;
                }}
                onExpand={(expandedKeys, obj) => {
                  this.setState({ expandedKeys });
                  if (obj.expanded) {
                    if (_.get(obj, "node.childCount") > 0) {
                      // this.fetchChildPage(obj.node, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams = {
                      ...params,
                      [TAXON_KEY_PARAMETER_NAMES[treeType]]: obj.node.key,
                    };

                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`,
                    });
                  } else {
                    const key = TAXON_KEY_PARAMETER_NAMES[treeType];
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(qs.parse(_.get(location, "search")), [key])
                      )}`,
                    });
                  }
                }}
              />
            )}
          </ColTreeContext.Consumer>
        )}
        {!error && treeData.length < rootTotal && (
          <Button loading={rootLoading} onClick={this.loadRoot}>
            Load more{" "}
          </Button>
        )}
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ rank, user }) => ({ rank, user });

export default withContext(mapContextToProps)(ColTree);
