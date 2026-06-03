import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  //Tree,
  App,
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
import { getSourcesBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import { ColTreeContext } from "./ColTreeContext";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
import Auth from "../../../components/Auth";
const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time

// antd 6's Tree.scrollTo throws when its inner virtual list ref hasn't
// attached yet (e.g. while the tree is still mounting after a reload). The
// outer ref is truthy but the inner list is null, so optional chaining at
// the call site doesn't help. Swallow that specific timing error — failing
// to scroll is harmless.
const scrollToKey = (treeInstance, key) => {
  if (!treeInstance || typeof treeInstance.scrollTo !== "function" || !key) {
    return;
  }
  try {
    treeInstance.scrollTo({ key });
  } catch (_e) {
    // Inner list not ready yet — give up silently.
  }
};
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

const LoadMoreChildrenTreeNode = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    onClick();
  };
  return (
    <div>
      {loading && <Spin />}
      {!loading && (
        <a onClick={handleClick}>
          <strong>Load more...</strong>
        </a>
      )}
    </div>
  );
};

const ColTree = (props) => {
  const { notification, message } = App.useApp();
  const {
    treeRef,
    dataset,
    projectKey,
    insertPlaceholder = false,
    treeType,
    showSourceTaxon,
    onDeleteSector,
    defaultExpandKey,
    draggable,
    onDragStart,
    location,
    attachFn,
    addError,
    rank,
    user,
    height,
  } = props;

  const [rootLoading, setRootLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [loadedKeys, setLoadedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [rootTotal, setRootTotal] = useState(0);
  const [error, setError] = useState(null);
  const [nodeNotFoundErr, setNodeNotFoundErr] = useState(null);

  const treeInstanceRef = useRef(null);

  // We keep a ref to treeData so async methods (fetchChildPage, reloadLoadedKeys)
  // always see the latest value without being re-created on every render.
  const treeDataRef = useRef(treeData);
  useEffect(() => {
    treeDataRef.current = treeData;
  }, [treeData]);

  const loadedKeysRef = useRef(loadedKeys);
  useEffect(() => {
    loadedKeysRef.current = loadedKeys;
  }, [loadedKeys]);

  // ─── helpers ─────────────────────────────────────────────────────────────

  const appendTypeParam = useCallback((treeType) => {
    const param = ["CATALOGUE", "readOnly"].includes(treeType)
      ? `&type=PROJECT`
      : ["SOURCE"].includes(treeType)
      ? `&type=${treeType}`
      : "";
    return param;
  }, []);

  const decorateWithSectorsAndDataset = useCallback(
    (res) => {
      if (!res.data.result) return Promise.resolve(res);
      const sectorLoader = new DataLoader((ids) =>
        getSectorsBatch(ids, projectKey)
      );
      const datasetLoader = new DataLoader((ids) =>
        getSourcesBatch(ids, projectKey)
      );

      return Promise.allSettled(
        res.data.result
          .filter((tx) => !!tx.sectorKey)
          .map((tx) =>
            sectorLoader.load(tx.sectorKey, projectKey).then((r) => {
              if (!r) {
                setError({ message: `Sector ${tx.sectorKey} was not found` });
              } else {
                tx.sector = r;
                return datasetLoader
                  .load(r.subjectDatasetKey)
                  .then((dataset) => (tx.sector.dataset = dataset));
              }
            })
          )
      ).then(() => res);
    },
    [projectKey]
  );

  const findNode = useCallback((id, nodeArray, findByName) => {
    let node = null;

    node = nodeArray.find((n) =>
      !findByName ? _.get(n, "taxon.id") === id : _.get(n, "taxon.name") === id
    );

    if (node) {
      return node;
    } else {
      const children = nodeArray.map((n) => _.get(n, "children") || []);
      const flattenedChildren = _.flatten(children);
      if (flattenedChildren.length === 0) {
        return null;
      } else {
        return findNode(id, flattenedChildren, findByName);
      }
    }
  }, []);

  // fetchChildPage is declared before loadRoot because loadRoot uses it
  const fetchChildPage = useCallback(
    async (dataRef, reloadAll, dontUpdateState) => {
      const { treeData: _treeData } = { treeData: treeDataRef.current };
      const childcount = _.get(dataRef, "childCount");
      const limit = CHILD_PAGE_SIZE;
      const offset = _.get(dataRef, "childOffset");

      const res = await axios(
        `${config.dataApi}dataset/${dataset.key}/tree/${
          encodeURIComponent(dataRef.taxon.id) //taxonKey
        }/children?limit=${limit}&offset=${offset}&insertPlaceholder=${insertPlaceholder}&projectKey=${projectKey}${appendTypeParam(
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
      let decoratedRes = await decorateWithSectorsAndDataset(resWithSectorKeys);
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
                treeType={treeType}
                reloadSelfAndSiblings={() => {
                  const loadedChildIds = dataRef.children
                    ? dataRef.children
                        .filter((c) => c.children && c.children.length > 0)
                        .map((c) => c.key)
                    : null;
                  return fetchChildPage(dataRef, true).then(() =>
                    loadedChildIds
                      ? reloadLoadedKeys(loadedChildIds, false)
                      : false
                  );
                }}
                reloadChildren={() => fetchChildPage(childDataRef, true)}
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
        const currentTreeData = treeDataRef.current;
        const loadMoreFn = () => {
          dataRef.childOffset += CHILD_PAGE_SIZE;
          if (
            dataRef.children[dataRef.children.length - 1].key ===
            "__loadMoreBTN__"
          ) {
            dataRef.children = dataRef.children.slice(0, -1);
          }
          setTreeData([...treeDataRef.current]);
          fetchChildPage(dataRef, false);
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
        setTreeData([...treeDataRef.current]);
        setLoadedKeys((prev) => [...new Set([...prev, dataRef.key])]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dataset,
      projectKey,
      treeType,
      insertPlaceholder,
      appendTypeParam,
      decorateWithSectorsAndDataset,
      onDeleteSector,
      showSourceTaxon,
    ]
  );

  // forward-declare reloadLoadedKeys so fetchChildPage can reference it
  // (both reference each other; the ref trick breaks the circular dep)
  const reloadLoadedKeysRef = useRef(null);

  const reloadLoadedKeys = useCallback(
    async (keys, expandAll = true) => {
      setRootLoading(true);
      const storedKeys = loadedKeysRef.current;

      let currentTreeData = treeDataRef.current;
      const targetTaxon = defaultExpandKey
        ? findNode(defaultExpandKey, currentTreeData)
        : null;
      const loadedKeysList = keys ? [...keys] : [...storedKeys];
      for (let index = 0; index < loadedKeysList.length; index++) {
        let node = findNode(loadedKeysList[index], currentTreeData);
        if (!node && targetTaxon && loadedKeysList[index - 1]) {
          // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node
          const parentNode = findNode(
            loadedKeysList[index - 1],
            currentTreeData
          );
          if (
            parentNode &&
            _.isArray(_.get(parentNode, "children")) &&
            parentNode.children.length > 0
          ) {
            node = await pageThroughChildrenUntilTaxonFound(
              parentNode,
              loadedKeysList[index]
            );
            if (node) {
              loadedKeysList.splice(index, 0, node.taxon.id);
            } else {
              // It has gone missing from the tree
              setNodeNotFoundErr(
                <span>
                  Cannot find taxon {defaultExpandKey} in tree &#128549;
                </span>
              );
              setRootLoading(false);
              if (
                treeType === "CATALOGUE" &&
                typeof props.addMissingTargetKey === "function"
              ) {
                props.addMissingTargetKey(defaultExpandKey);
              }
            }
          }
        }
        if (node) {
          await fetchChildPage(node, true, true);
          let targetNode = node.children.find(
            (c) => _.get(c, "taxon.id") === _.get(targetTaxon, "taxon.id")
          );
          if (
            targetTaxon &&
            index === loadedKeysList.length - 2 &&
            _.get(node, "taxon.id") !== _.get(targetTaxon, "taxon.id") &&
            _.isArray(node.children) &&
            !targetNode
          ) {
            if (node.children.length < node.childCount) {
              // its the parent of the taxon we are after - if its not in the first page, insert it
              targetNode = await pageThroughChildrenUntilTaxonFound(
                node,
                _.get(targetTaxon, "taxon.id")
              );
              if (targetNode) {
                setTreeData([...treeDataRef.current]);
                setTimeout(() => {
                  scrollToKey(treeInstanceRef.current, defaultExpandKey);
                }, 100);
              } else {
                // It has gone missing from the tree
                setNodeNotFoundErr(
                  <span>
                    Cannot find taxon {defaultExpandKey} in tree &#128549;
                  </span>
                );
                if (
                  treeType === "CATALOGUE" &&
                  typeof props.addMissingTargetKey === "function"
                ) {
                  props.addMissingTargetKey(defaultExpandKey);
                }
              }
            }
          } else {
            setTimeout(() => {
              scrollToKey(treeInstanceRef.current, defaultExpandKey);
            }, 100);
          }
        }
      }
      const newLoadedKeys = loadedKeysList;
      setLoadedKeys(newLoadedKeys);
      setRootLoading(false);
      if (expandAll) {
        setExpandedKeys(newLoadedKeys);
      }
      if (defaultExpandKey) {
        setTimeout(() => {
          scrollToKey(treeInstanceRef.current, defaultExpandKey);
        }, 100);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultExpandKey, treeType, findNode, fetchChildPage, props.addMissingTargetKey]
  );

  // Keep the ref up to date so fetchChildPage can call the latest version
  useEffect(() => {
    reloadLoadedKeysRef.current = reloadLoadedKeys;
  }, [reloadLoadedKeys]);

  const pageThroughChildrenUntilTaxonFound = useCallback(
    async (parentNode, taxonId) => {
      let node;
      while (!node && parentNode.children.length < parentNode.childCount) {
        parentNode.childOffset += CHILD_PAGE_SIZE;
        if (
          parentNode.children[parentNode.children.length - 1].key ===
          "__loadMoreBTN__"
        ) {
          parentNode.children = parentNode.children.slice(0, -1);
        }
        await fetchChildPage(parentNode, false, true);
        node = findNode(taxonId, parentNode.children);
      }
      if (!node) {
        node = parentNode.children.find((c) =>
          _.get(c, "taxon.id")
            ? c.taxon.id.indexOf("incertae-sedis") > -1
            : false
        );
      }
      return node;
    },
    [fetchChildPage, findNode]
  );

  const loadRoot = useCallback(async () => {
    const {
      dataset: { key },
    } = props;
    setRootLoading(true);
    setTreeData([]);
    let id = key;
    return axios(
      `${
        config.dataApi
      }dataset/${id}/tree?projectKey=${projectKey}${appendTypeParam(
        treeType
      )}&limit=${CHILD_PAGE_SIZE}&offset=0&insertPlaceholder=${insertPlaceholder}`
    )
      .then(decorateWithSectorsAndDataset)
      .then((res) => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const newTreeData = mainTreeData.map((tx) => {
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
              treeType={treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={reloadRoot}
              reloadChildren={() => {
                return fetchChildPage(dataRef, true);
              }}
            />
          );
          dataRef.ref = dataRef;
          return dataRef;
        });

        setRootTotal(rootTotal);
        setRootLoading(false);
        setTreeData(newTreeData);
        setError(null);

        if (defaultExpandKey) {
          // expandToTaxon reads treeData from state; we need the updated value.
          // We set treeDataRef synchronously here so expandToTaxon sees it.
          treeDataRef.current = newTreeData;
          return expandToTaxon(defaultExpandKey, newTreeData);
        } else {
          setExpandedKeys(newTreeData.length < 10 ? newTreeData.map((n) => n.taxon.id) : []);
        }
      })
      .catch((err) => {
        setTreeData([]);
        setRootLoading(false);
        setExpandedKeys([]);
        setError(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dataset,
    projectKey,
    treeType,
    insertPlaceholder,
    defaultExpandKey,
    appendTypeParam,
    decorateWithSectorsAndDataset,
    onDeleteSector,
    showSourceTaxon,
    fetchChildPage,
  ]);

  const expandToTaxon = useCallback(
    async (expandKey, currentTreeData) => {
      const {
        dataset: { key },
      } = props;
      setRootLoading(true);
      let id = key;
      const { data } = await axios(
        `${config.dataApi}dataset/${id}/tree/${encodeURIComponent(
          expandKey
        )}?projectKey=${projectKey}&insertPlaceholder=${insertPlaceholder}${appendTypeParam(
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
          decorateWithSectorsAndDataset({
            data: { result: res.data },
          }).then(() => res)
        );

      if (data.length === 0) {
        // The taxon isn't in this tree. The tree endpoint answers 200 with an
        // empty array (not a 404) for unknown ids, so we land here. loadRoot()
        // has already populated the root level before calling us, so just
        // surface the error and stop. Calling loadRoot() here would re-trigger
        // expandToTaxon(defaultExpandKey) -> empty -> loadRoot() and spin
        // forever (issue #1666).
        setError({
          message: `No classification found for Taxon ID: ${expandKey}`,
        });
        setRootLoading(false);
        return;
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
          treeType={treeType}
          showSourceTaxon={showSourceTaxon}
          reloadSelfAndSiblings={() => {
            const loadedChildIds = root.children
              ? root.children
                  .filter((c) => c.children && c.children.length > 0)
                  .map((c) => c.key)
              : null;
            return loadRoot().then(() =>
              loadedChildIds
                ? reloadLoadedKeysRef.current(loadedChildIds, false)
                : false
            );
          }}
          reloadChildren={() => fetchChildPage(root, true)}
        />
      );
      root.ref = root;
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
            treeType={treeType}
            showSourceTaxon={showSourceTaxon}
            reloadSelfAndSiblings={() => {
              const loadedChildIds = root.children
                ? root.children
                    .filter((c) => c.children && c.children.length > 0)
                    .map((c) => c.key)
                : null;
              return fetchChildPage(root, true).then(() =>
                loadedChildIds
                  ? reloadLoadedKeysRef.current(loadedChildIds, false)
                  : false
              );
            }}
            reloadChildren={() => fetchChildPage(node, true)}
          />
        );

        root.children = [node];
        root = node;
      }

      const treeDataSnapshot = currentTreeData || treeDataRef.current;
      var rootIndex = treeDataSnapshot.findIndex((x) => x.key == root_.key);
      treeDataSnapshot[rootIndex] = root_;

      const loadedKeysList = [...data.map((t) => t.id).reverse()];

      setTreeData(treeDataSnapshot);
      treeDataRef.current = treeDataSnapshot;
      setRootLoading(false);
      return reloadLoadedKeysRef.current(loadedKeysList);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props,
      projectKey,
      insertPlaceholder,
      treeType,
      dataset,
      onDeleteSector,
      showSourceTaxon,
      appendTypeParam,
      decorateWithSectorsAndDataset,
      fetchChildPage,
    ]
  );

  const reloadRoot = useCallback(() => {
    return new Promise((resolve) => {
      setRootLoading(true);
      setTreeData([]);
      setLoadedKeys([]);
      setRootTotal(0);
      setError(null);
      setNodeNotFoundErr(null);
      setSelectedNodes([]);
      setSelectedKeys([]);
      resolve(loadRoot());
    });
  }, [loadRoot]);

  const onLoadData = useCallback(
    (treeNode, reloadAll = false) => {
      if (reloadAll) {
        treeNode.childOffset = 0;
      }
      return fetchChildPage(treeNode.ref, reloadAll);
    },
    [fetchChildPage]
  );

  // ─── effect: register imperative handle with parent ───────────────────────
  useEffect(() => {
    if (typeof treeRef === "function") {
      // Expose the same surface that Assembly/index.js accesses:
      // .reloadRoot(), .reloadLoadedKeys(), and .state.selectedNodes
      treeRef({
        reloadRoot,
        reloadLoadedKeys,
        state: { get selectedNodes() { return selectedNodes; } },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeRef, reloadRoot, reloadLoadedKeys, selectedNodes]);

  // ─── effect: initial load ─────────────────────────────────────────────────
  useEffect(() => {
    loadRoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── effect: reset + reload when dataset/project/insertPlaceholder changes ─
  const prevDatasetKeyRef = useRef(dataset.key);
  const prevProjectKeyRef = useRef(projectKey);
  const prevInsertPlaceholderRef = useRef(insertPlaceholder);

  useEffect(() => {
    const prevDatasetKey = prevDatasetKeyRef.current;
    const prevProjectKey = prevProjectKeyRef.current;
    const prevInsertPlaceholder = prevInsertPlaceholderRef.current;

    prevDatasetKeyRef.current = dataset.key;
    prevProjectKeyRef.current = projectKey;
    prevInsertPlaceholderRef.current = insertPlaceholder;

    if (
      prevDatasetKey !== dataset.key ||
      prevProjectKey !== projectKey ||
      prevInsertPlaceholder !== insertPlaceholder
    ) {
      setTreeData([]);
      setLoadedKeys([]);
      setExpandedKeys([]);
      setSelectedKeys([]);
      loadRoot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset.key, projectKey, insertPlaceholder]);

  // ─── drag-and-drop handlers ───────────────────────────────────────────────

  const confirmAttach = useCallback(
    (node, dragNode, mode) => {
      node.title = React.cloneElement(node.title, { isUpdating: true });

      setTreeData([...treeDataRef.current]);
      attachFn(node, dragNode, mode).then((res) => {
        dragNode.title.props.reloadSelfAndSiblings();
        node.title.props
          .reloadSelfAndSiblings()
          .then(() => {
            const children =
              _.get(node, "parent.children") || treeDataRef.current;
            const newNodeReference =
              mode === "REPLACE"
                ? findNode(dragNode.taxon.name, children, true)
                : findNode(node.taxon.id, children);
            fetchChildPage(newNodeReference, true).then(
              () =>
                (node.title = React.cloneElement(node.title, {
                  isUpdating: false,
                }))
            );
          })
          .catch(addError);
      });
    },
    [attachFn, addError, findNode, fetchChildPage]
  );

  const confirmMultiAttach = useCallback(
    (node, dragNodes) => {
      node.title = React.cloneElement(node.title, { isUpdating: true });

      setTreeData([...treeDataRef.current]);
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
            const newNodeReference = node?.parent?.children
              ? findNode(node.taxon.id, node.parent.children)
              : node.taxon;
            fetchChildPage(newNodeReference, true).then(
              () =>
                (node.title = React.cloneElement(node.title, {
                  isUpdating: false,
                }))
            );
          })
          .catch(addError);
      });
    },
    [attachFn, addError, findNode, fetchChildPage]
  );

  const replaceSectorTarget = useCallback(
    (node, dragNode) => {
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
                _.get(node, "parent.children") || treeDataRef.current;
              const newNodeReference = findNode(node.taxon.id, children);
              fetchChildPage(newNodeReference, true).then(
                () =>
                  (node.title = React.cloneElement(node.title, {
                    isUpdating: false,
                  }))
              );
              notification.open({
                message: `Sector target updated`,
              });
            })
            .catch(addError);
        });
    },
    [addError, findNode, fetchChildPage]
  );

  const handleAttach = useCallback(
    (e) => {
      const dragNode = props.dragNode.ref;
      const { selectedSourceTreeNodes } = props;
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
          _.get(dragNode, "taxon.sector.subject.id") &&
        _.get(node, "taxon.id") !== _.get(dragNode, "taxon.sector.target.id");
      const sectorAlreadyExists =
        _.get(dragNode, "taxon.sector") &&
        _.get(dragNode, "taxon.id") ===
          _.get(dragNode, "taxon.sector.subject.id") &&
        _.get(node, "taxon.id") === _.get(dragNode, "taxon.sector.target.id");

      if (dragNode.taxon.datasetKey === node.taxon.datasetKey) {
        message.warn("You cannot modify the Tree in attachment mode");
        return; // we are in modify mode and should not react to the event
      }
      if (nodeIsPlaceholder) {
        message.warn("You cannot create sectors on placeholder nodes");
        return;
      }

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
                title="Subject rank is higher than target rank"
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
            You may also choose to UNION or MERGE.
            {willProduceDuplicateChild && (
              <Alert
                style={{ marginTop: "6px" }}
                type="error"
                title={
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
                title="Subject rank is higher than target rank"
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
                title="Subject rank is higher than target rank"
                type="warning"
              />
            )}
            {draggedNodeRanksAreMixed && (
              <Alert
                title={`You selected nodes of ${
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
                title={
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
                title="Subject rank is higher than target rank"
                type="warning"
              />
            )}
            Replace sector target?
            <br />
            {willProduceDuplicateChild && (
              <Alert
                style={{ marginTop: "6px" }}
                type="error"
                title={
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

      if (sectorAlreadyExists) {
        msg = (
          <span>
            <Alert
              style={{ marginTop: "6px" }}
              type="error"
              title={
                <div>
                  This target taxon already has a sector based on{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: dragNode.taxon.name }}
                  />{" "}
                  (taxonID {dragNode.taxon.id})
                </div>
              }
            />
          </span>
        );
      }

      const unionOptions = dragNodeIsPlaceholder
        ? [
            {
              text: "Union",
              action: () => confirmAttach(node, dragNode, "UNION"),
            },
          ]
        : taxonNameIsEqual
        ? [
            {
              text: "Attach",
              type: "dashed",
              action: () => confirmAttach(node, dragNode, "ATTACH"),
            },
            {
              text: "Merge",
              type: "dashed",
              action: () => confirmAttach(node, dragNode, "MERGE"),
            },
            {
              text: "Replace",
              type: "danger",
              disabled: !node?.taxon?.parentId,
              action: () => confirmAttach(node, dragNode, "REPLACE"),
            },

            {
              text: "Union",
              type: "primary",
              action: () => confirmAttach(node, dragNode, "UNION"),
            },
          ]
        : [
            {
              text: "Attach",
              type: "dashed",
              action: () => confirmAttach(e.node, dragNode, "ATTACH"),
            },
            {
              text: "Merge",
              type: "dashed",
              action: () => confirmAttach(node, dragNode, "MERGE"),
            },
            {
              text: "Union",
              type: "primary",
              action: () => confirmAttach(node, dragNode, "UNION"),
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
              confirmMultiAttach(node, [
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
            action: () => replaceSectorTarget(node, dragNode),
          },
        ];
      } else if (sectorAlreadyExists) {
        actions = [];
      } else if (mode === "ATTACH") {
        actions = [
          {
            text: "Union",
            type: "dashed",
            action: () => confirmAttach(node, dragNode, "UNION"),
          },
          {
            text: "Merge",
            type: "dashed",
            action: () => confirmAttach(node, dragNode, "MERGE"),
          },
          {
            text: "Attach",
            type: "primary",
            action: () => confirmAttach(node, dragNode, "ATTACH"),
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
          setTreeData([...treeDataRef.current]);
        },
      });

      console.log(
        dragNode.title.props.taxon.name +
          " --> " +
          node.ref.title.props.taxon.name
      );
      setTreeData([...treeDataRef.current]);
    },
    [props, rank, confirmAttach, confirmMultiAttach, replaceSectorTarget]
  );

  const confirmModify = useCallback(
    (e, nodeTitle) => {
      const dragNode = props.dragNode.ref;
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
          setTreeData([...treeDataRef.current]);
          notification.open({
            message: "Taxon moved",
            description: msg,
          });
        })
        .catch(addError);
    },
    [props, addError]
  );

  const handleModify = useCallback(
    (e) => {
      if (e.dragNode.name === "Not assigned") {
        message.warn("You cannot move placeholder nodes");
        return;
      }

      const msg = (
        <span>
          Move <span dangerouslySetInnerHTML={{ __html: e.dragNode.name }} />{" "}
          from parent{" "}
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
          confirmModify(e, nodeTitle);
        },
        onCancel: () => {
          e.node.ref.title = nodeTitle;
        },
      });
      setTreeData([...treeDataRef.current]);
    },
    [confirmModify]
  );

  const handleDrop = useCallback(
    (e, mode) => {
      if (treeType !== "CATALOGUE") {
        return;
      }
      if (mode === "attach") {
        handleAttach(e);
      } else if (mode === "modify") {
        handleModify(e);
      }
    },
    [treeType, handleAttach, handleModify]
  );

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <React.Fragment>
      {error && (
        <React.Fragment>
          {_.get(error, "response.data.code") !== 404 ? (
            <Alert
              closable={{ onClose: () => setError(null) }}
              style={{ marginTop: "8px" }}
              description={<ErrorMsg error={error} />}
              type="error"
            />
          ) : (
            <Alert
              closable={{ onClose: () => setError(null) }}
              style={{ marginTop: "8px" }}
              title={
                <Custom404
                  error={error}
                  treeType={treeType}
                  dataset={dataset}
                  loadRoot={loadRoot}
                />
              }
              type="warning"
            />
          )}
        </React.Fragment>
      )}
      {nodeNotFoundErr && (
        <Alert
          closable={{ onClose: () => setNodeNotFoundErr(null) }}
          style={{ marginTop: "8px" }}
          title={nodeNotFoundErr}
          type="warning"
        />
      )}
      {rootLoading && <Skeleton paragraph={{ rows: 10 }} active />}
      {!rootLoading && treeData.length > 0 && (
        <ColTreeContext.Consumer>
          {({ mode }) => (
            <Tree.DirectoryTree
              expandAction={false}
              ref={treeInstanceRef}
              height={height || 800}
              // showLine={{showLeafIcon: false}}
              showIcon={false}
              defaultExpandAll={false}
              // defaultExpandedKeys={defaultExpandedKeys}
              draggable={draggable}
              // dragNode is the in-flight drag from the *other* tree —
              // the wrapper uses it to attach native drop listeners so
              // cross-tree drops (which antd's Tree silently drops) get
              // dispatched as our own onDrop event.
              dragNode={props.dragNode}
              onDrop={(e) => handleDrop(e, mode)}
              onDragStart={onDragStart}
              loadData={onLoadData}
              onLoad={(keys) => setLoadedKeys(keys)}
              loadedKeys={loadedKeys}
              expandedKeys={expandedKeys}
              multiple
              treeData={treeData}
              selectedKeys={treeType !== "readOnly" ? selectedKeys : []}
              selectable={treeType !== "readOnly"}
              onSelect={(keys, e) => {
                setSelectedKeys(keys);
                setSelectedNodes(e.selectedNodes);
              }}
              filterTreeNode={(node) => {
                return node.key === defaultExpandKey;
              }}
              onExpand={(keys, obj) => {
                setExpandedKeys(keys);
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
                    pathname: location.pathname,
                    search: `?${qs.stringify(newParams)}`,
                  });
                } else {
                  const key = TAXON_KEY_PARAMETER_NAMES[treeType];
                  history.push({
                    pathname: location.pathname,
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
        <Button loading={rootLoading} onClick={loadRoot}>
          Load more{" "}
        </Button>
      )}
    </React.Fragment>
  );
};

const mapContextToProps = ({ rank, user, addError }) => ({
  rank,
  user,
  addError,
});

export default withContext(mapContextToProps)(ColTree);
