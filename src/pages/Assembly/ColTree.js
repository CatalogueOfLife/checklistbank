import React from "react";
import { Tree, notification, message, Alert, Spin } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import colTreeActions from "./ColTreeActions";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../../components/ErrorMsg";
import { getSectorsBatch } from "../../api/sector";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
import { ColTreeContext } from "./ColTreeContext";
import history from "../../history";

const sectorLoader = new DataLoader(ids => getSectorsBatch(ids));
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const TreeNode = Tree.TreeNode;
const CHILD_PAGE_SIZE = 100; // How many children will we load at a time

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
      expandedKeys: [],
      loadedKeys: [],
      error: null,
      mode: "attach",
      ranks: []
    };
  }

  componentWillMount() {
    this.loadRoot();
    this.loadRanks();
    if (this.props.treeType === "gsd") {
      colTreeActions.on("attachmentSuccess", dragNode => {
        if (dragNode.dataset === this.props.dataset) {
          dragNode.props.dataRef.title = (
            <ColTreeNode
              taxon={dragNode.props.title.props.taxon}
              datasetKey={dragNode.props.title.props.datasetKey}
            />
          );
          this.setState({ treeData: [...this.state.treeData] });
        }
      });
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.dataset.key !== this.props.dataset.key) {
      this.setState({ treeData: [] }, this.loadRoot);
    }
    if (nextProps.defaultExpandKey !== this.props.defaultExpandKey) {
      this.setState({ treeData: [] }, this.loadRoot);
    }
  }
  loadRanks = () => {
    axios(`${config.dataApi}vocab/rank`).then(res => {
      this.setState({ ranks: res.data.map(e => e.name) });
    });
  };
  loadRoot = () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      defaultExpandKey
    } = this.props;
    let id = key;
    let p = defaultExpandKey
      ? axios(
          `${config.dataApi}dataset/${id}/tree/${encodeURIComponent(
            defaultExpandKey
          )}`
        ).then(res =>
          this.decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )
      : Promise.resolve(false);
    var defaultExpandedNodes;
    return Promise.all([
      axios(`${config.dataApi}dataset/${id}/tree`).then(
        this.decorateWithSectorsAndDataset
      ),
      p
    ])
      .then(values => {
        const mainTreeData = values[0].data.result;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map(tx => {
          return {
            title: (
              <ColTreeNode
                taxon={tx}
                datasetKey={id}
                confirmVisible={false}
                hasPopOver={this.props.treeType === "mc"}
                showSourceTaxon={showSourceTaxon}
                reloadSelfAndSiblings={this.loadRoot}
              />
            ),
            taxon: tx,
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            childOffset: 0
          };
        });
        if (defaultExpanded) {
          defaultExpandedNodes = _.map(defaultExpanded, "id");
          let root_ = _.find(treeData, [
            "key",
            defaultExpanded[defaultExpanded.length - 1].id
          ]);
          const nodes = defaultExpanded
            .slice(0, defaultExpanded.length - 1)
            .reverse();
          nodes.reduce((root, tx) => {
            const node = {
              title: (
                <ColTreeNode
                  taxon={tx}
                  datasetKey={id}
                  showSourceTaxon={showSourceTaxon}
                  reloadSelfAndSiblings={() => this.fetchChildPage(root, true)}
                />
              ),
              taxon: tx,
              key: tx.id,
              childCount: tx.childCount,
              childOffset: 0
            };
            root.children = [node];
            return node;
          }, root_);
        }
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            treeData:
              treeType === "mc"
                ? [...treeData]
                : treeData.filter(r => r.childCount > 0),
            defaultExpandAll:
              !defaultExpanded && treeType !== "mc" && treeData.length < 10,
            error: null,
            defaultExpandedKeys: defaultExpandedNodes,
            expandedKeys: defaultExpandedNodes
          });
          if(treeType === "mc"){
            history.push({
              pathname: `/assembly`,
              search: `?assemblyTaxonKey=${
                defaultExpandKey
              }`
            });
          }
          
        } else {
          this.setState({
            treeData:
              treeType === "mc"
                ? [...treeData]
                : treeData.filter(r => r.childCount > 0),
            defaultExpandAll: treeType !== "mc" && treeData.length < 10,
            error: null
          });
        }
      })
      .catch(err => {
        this.setState({
          treeData: [],
          defaultExpandedKeys: null,
          expandedKeys: [],
          error: err
        });
      });
  };

  fetchChildPage = (dataRef, reloadAll) => {
    const { showSourceTaxon, dataset, treeType } = this.props;
    const { expandedKeys, loadedKeys } = this.state;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");
    const childKeys =
      _.get(dataRef, "children") && dataRef.children.length > 0
        ? dataRef.children.map(c => c.key)
        : [];
    return axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${encodeURIComponent(
        dataRef.taxon.id //taxonKey
      )}/children?limit=${limit}&offset=${offset}`
    )
      .then(res => {
        if (treeType === "gsd" && _.get(dataRef, "taxon.sectorKey")) {
          // If it is a GSD and the parent has a sectorKey, copy it to children
          return {
            ...res,
            data: {
              ...res.data,
              result: res.data.result.map(r => ({
                ...r,
                sectorKey: _.get(dataRef, "taxon.sectorKey")
              }))
            }
          };
        } else {
          return res;
        }
      })
      .then(this.decorateWithSectorsAndDataset)
      .then(res =>
        res.data.result
          ? res.data.result.map(tx => {
              let childDataRef = {
                taxon: tx,
                key: tx.id,
                datasetKey: dataset.key,
                childCount: tx.childCount,
                childOffset: 0,
                parent: dataRef,
                name: tx.name
              };

              childDataRef.title = (
                <ColTreeNode
                  confirmVisible={false}
                  taxon={tx}
                  datasetKey={dataset.key}
                  hasPopOver={this.props.treeType === "mc"}
                  reloadSelfAndSiblings={() =>
                    this.fetchChildPage(dataRef, true)
                  }
                  // reloadChildren={() => this.onLoadData({props: {dataRef: dataRef}}, true)}
                  showSourceTaxon={showSourceTaxon}
                />
              );

              return childDataRef;
            })
          : []
      )
      .then(data => {
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;

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
                treeData: [...this.state.treeData],
                defaultExpandAll: false
              }
              ,
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
              childCount: 0
            }
          ];
        }
        this.setState({
          treeData: [...this.state.treeData],
          defaultExpandAll: false,
          expandedKeys: [
            ...new Set([
              ...expandedKeys.filter(k => !childKeys.includes(k)),
              dataRef.key
            ])
          ],
          loadedKeys: loadedKeys.filter(k => !childKeys.includes(k))
        });
      });
  };

  decorateWithSectorsAndDataset = res => {
    if (!res.data.result) return res;

    return Promise.all(
      res.data.result
        .filter(tx => !!tx.sectorKey)
        .map(tx =>
          sectorLoader.load(tx.sectorKey).then(r => {
            tx.sector = r;
            return datasetLoader
              .load(r.datasetKey)
              .then(dataset => (tx.sector.dataset = dataset));
          })
        )
    ).then(() => res);
  };

  onLoadData = (treeNode, reloadAll = false) => {
    const {
      props: { dataRef }
    } = treeNode;
    if (reloadAll) {
      dataRef.childOffset = 0;
    }

    return this.fetchChildPage(dataRef, reloadAll);
  };

  confirmAttach = (node, dragNode, mode) => {
    /*
       This is where sector mapping should be posted to the server
       */
    node.props.dataRef.title = (
      <ColTreeNode
        taxon={node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        isUpdating={true}
        confirmVisible={false}
        reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
      />
    );
    this.setState({ treeData: [...this.state.treeData] });
    this.props.attachFn(node, dragNode, mode).then(res => {
      node.props.dataRef.title = (
        <ColTreeNode
          taxon={node.props.title.props.taxon}
          datasetKey={this.props.dataset.key}
          isUpdating={false}
          confirmVisible={false}
          reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
        />
      );
      node.props.dataRef.title.props.reloadSelfAndSiblings().then(() => {
        this.onLoadData(node, true);
      });
      //  .catch((err)=> alert(err));
    });
  };

  handleAttach = e => {
    const { dragNode } = this.props;
    if (
      dragNode.props.dataRef.taxon.datasetKey ===
      e.node.props.dataRef.taxon.datasetKey
    ) {
      message.warn("You cant modify the CoL draft in attachment mode");
      return; // we are in modify mode and should not react to the event
    }
    const { ranks } = this.state;
    if (
      ranks.indexOf(dragNode.props.title.props.taxon.rank) <
      ranks.indexOf(e.node.props.title.props.taxon.rank)
    ) {
      message.warn("Subject rank is higher than target rank");
      return;
    }
    // default to attach mode
    let mode = "ATTACH";
    if (
      dragNode.props.title.props.taxon.rank ===
      e.node.props.title.props.taxon.rank
    ) {
      mode = "MERGE";
    }
    const msg =
      mode === "ATTACH" ? (
        <span>
          Attach{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: dragNode.props.title.props.taxon.name
            }}
          />{" "}
          from {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.props.title.props.taxon.name
            }}
          />{" "}
          in {this.props.dataset.title}?
        </span>
      ) : (
        <span>
          Ranks are equal. Do you want to replace or merge children of{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: dragNode.props.title.props.taxon.name
            }}
          />{" "}
          in {dragNode.dataset.title} into children of{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.props.title.props.taxon.name
            }}
          />{" "} 
        </span>
      );

    e.node.props.dataRef.title = (
      <ColTreeNode
        taxon={e.node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        confirmVisible={true}
        confirmTitle={msg}
        reloadSelfAndSiblings={e.node.props.title.props.reloadSelfAndSiblings}
        
        actions={
          mode === 'ATTACH' ? [{
            text: 'Ok',
            action: () => this.confirmAttach(e.node, dragNode, mode)
          }] : [{
            text: 'Merge',
            action: () => this.confirmAttach(e.node, dragNode, 'MERGE')
          }, {
            text: 'Replace',
            action: () => this.confirmAttach(e.node, dragNode, 'REPLACE')
          }]
        }
        onCancel={() => {
          e.node.props.dataRef.title = (
            <ColTreeNode
              taxon={e.node.props.title.props.taxon}
              datasetKey={this.props.dataset.key}
              confirmVisible={false}
              reloadSelfAndSiblings={
                e.node.props.title.props.reloadSelfAndSiblings
              }
            />
          );
          this.setState({ treeData: [...this.state.treeData] });
        }}
      />
    );
    console.log(
      dragNode.props.dataRef.title.props.taxon.name +
        " --> " +
        e.node.props.dataRef.title.props.taxon.name
    );
    this.setState({ treeData: [...this.state.treeData] });
  };
  confirmModify = e => {
    const parent = e.node.props.dataRef.title.props.taxon;
    const draggedTaxon = e.dragNode.props.dataRef.title.props.taxon;
    axios(
      `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${
        draggedTaxon.id
      }`
    )
      .then(res => res.data)
      .then(draggedTaxon =>
        axios.put(
          `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${
            draggedTaxon.id
          }`,
          { ...draggedTaxon, parentId: parent.id }
        )
      )
      .then(res => {
        if (e.node.props.dataRef.children) {
          e.node.props.dataRef.children.push(e.dragNode.props.dataRef);
        } else {
          e.node.props.dataRef.children = [e.dragNode.props.dataRef];
        }
        _.remove(e.dragNode.props.dataRef.parent.children, function(n) {
          return n.key === e.dragNode.props.dataRef.key;
        });
        e.node.props.dataRef.title = (
          <ColTreeNode
            taxon={e.node.props.title.props.taxon}
            datasetKey={this.props.dataset.key}
            confirmVisible={false}
          />
        );
        let msg = (
          <span>
            You moved{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: e.dragNode.props.dataRef.name
              }}
            />{" "}
            from parent{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: e.dragNode.props.dataRef.parent.title.props.taxon.name
              }}
            />{" "}
            to parent{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: e.node.props.dataRef.title.props.taxon.name
              }}
            />
          </span>
        );
        this.setState(
          {
            treeData: [...this.state.treeData],
            defaultExpandAll: false
          },
          () => {
            notification.open({
              message: "Taxon moved",
              description: msg
            });
          }
        );
      })
      .catch(err => {
        alert(err);
      });
  };
  handleModify = e => {
    const msg = (
      <span>
        Move{" "}
        <span
          dangerouslySetInnerHTML={{ __html: e.dragNode.props.dataRef.name }}
        />{" "}
        from parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.dragNode.props.dataRef.parent.title.props.taxon.name
          }}
        />{" "}
        to parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.node.props.dataRef.title.props.taxon.name
          }}
        />
        ?
      </span>
    );
    e.node.props.dataRef.title = (
      <ColTreeNode
        taxon={e.node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        confirmVisible={true}
        confirmTitle={msg}
        onConfirm={() => {
          this.confirmModify(e);
        }}
        onCancel={() => {
          e.node.props.dataRef.title = (
            <ColTreeNode
              taxon={e.node.props.title.props.taxon}
              datasetKey={this.props.dataset.key}
              confirmVisible={false}
            />
          );
          this.setState({ treeData: [...this.state.treeData] });
        }}
      />
    );
    this.setState({ treeData: [...this.state.treeData] });
  };
  handleDrop = (e, mode) => {
    const { treeType } = this.props;
    if (treeType !== "mc") {
      return;
    }
    if (mode === "attach") {
      this.handleAttach(e);
    } else if (mode === "modify") {
      this.handleModify(e);
    }
  };

  renderTreeNodes = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <TreeNode
            datasetKey={item.datasetKey}
            title={item.title}
            key={item.key}
            dataRef={item}
            isLeaf={item.childCount === 0}
          >
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          {...item}
          datasetKey={item.datasetKey}
          title={item.title}
          key={item.key}
          dataRef={item}
          isLeaf={item.childCount === 0}
        />
      );
    });
  };

  render() {
    const {
      error,
      treeData,
      defaultExpandAll,
      defaultExpandedKeys,
      expandedKeys,
      loadedKeys
    } = this.state;
    const { draggable, onDragStart } = this.props;
    return (
      <div>
        {" "}
        {error && (
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          />
        )}
        {treeData.length > 0 && (
          <ColTreeContext.Consumer>
            {({ mode }) => (
              <Tree
                showLine={true}
                defaultExpandAll={defaultExpandAll}
                defaultExpandedKeys={defaultExpandedKeys}
                expandedKeys={expandedKeys}
                draggable={draggable}
                onDrop={e => this.handleDrop(e, mode)}
                onDragStart={onDragStart}
                loadedKeys={loadedKeys}
                loadData={this.onLoadData}
                filterTreeNode={node =>
                  node.props.dataRef.key === this.props.defaultExpandKey
                }
                onLoad={(loadedKeys, obj) => this.setState({ loadedKeys })}
                onExpand={(expandedKeys, obj) => {
                  if (!obj.expanded) {
                    // Remove children when a node is collapsed to improve performance on large trees
                    delete obj.node.props.dataRef.children;
                    obj.node.props.dataRef.childOffset = 0;
                    this.setState(
                      {
                        expandedKeys: expandedKeys,
                        treeData: [...this.state.treeData],
                        loadedKeys: this.state.loadedKeys.filter(
                          k => k !== obj.node.props.dataRef.key
                        )
                      },
                      () => {
                        history.push({
                          pathname: `/assembly`
                        });
                      }
                    );
                  } else {
                    this.setState({ expandedKeys }, () => {
                      history.push({
                        pathname: `/assembly`,
                        search: `?assemblyTaxonKey=${
                          obj.node.props.dataRef.key
                        }`
                      });
                    });
                  }
                }}
              >
                {this.renderTreeNodes(treeData)}
              </Tree>
            )}
          </ColTreeContext.Consumer>
        )}
      </div>
    );
  }
}

export default ColTree;
