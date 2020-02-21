import React from "react";
import { Tree, notification, message, Alert, Spin, Button } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../../../components/ErrorMsg";
import Custom404 from "./Custom404"
import { getSectorsBatch } from "../../../api/sector";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import { ColTreeContext } from "./ColTreeContext";
import history from "../../../history";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
const sectorLoader = new DataLoader(ids => getSectorsBatch(ids));
const datasetLoader = new DataLoader(ids => getDatasetsBatch(ids));
const TreeNode = Tree.TreeNode;
const CHILD_PAGE_SIZE = 1000; // How many children will we load at a time
const IRREGULAR_RANKS = [
  "unranked",
  "other",
  "infraspecific name",
  "infrageneric name",
  "infrasubspecific name",
  "suprageneric name"
];

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
      rootTotal: 0,
      error: null,
      mode: "attach",
      ranks: [],
      nodeNotFoundErr: null
    };
  }

  componentDidMount = () => {
    this.loadRoot();
    this.loadRanks();
    const { treeRef } = this.props;
    treeRef(this);
  };


  componentDidUpdate = (prevProps) => {
    if (prevProps.dataset.key !== this.props.dataset.key) {
      this.setState({ treeData: [] }, this.loadRoot);
    }
  }

  loadRanks = () => {
    axios(`${config.dataApi}vocab/rank`).then(res => {
      this.setState({ ranks: res.data.map(e => e.name) });
    });
  };

  reloadRoot = () => this.setState({ rootLoading: true,
    treeData: [],
    loadedKeys: [],
    rootTotal: 0,
    error: null,
    mode: "attach",
    ranks: [],
    nodeNotFoundErr: null }, this.loadRoot);
  

/*   loadRoot = () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      defaultExpandKey,
      catalogueKey,
      location
    } = this.props;
    this.setState({rootLoading: true, treeData: []})
    let id = key;
    let p = defaultExpandKey
      ? axios(
          `${config.dataApi}dataset/${id}/tree/${
            defaultExpandKey
          }?catalogueKey=${treeType === "gsd" ? catalogueKey : key}`
        )
          .then(res => {
            // Load the siblings of the default expanded taxon
            return _.get(res, "data[1]")
              ? axios(
                  `${config.dataApi}dataset/${key}/tree/${
                    _.get(res, "data[1].id") //taxonKey
                  }/children?limit=${CHILD_PAGE_SIZE}&offset=0&insertPlaceholder=true&catalogueKey=${
                    treeType === "gsd" ? catalogueKey : key
                  }`
                )
                  .then(this.decorateWithSectorsAndDataset)
                  .then(children => {
                    // Remove the the default expanded taxon as it will be loaded
                    if (
                      children.data.result &&
                      children.data.result.length > 0
                    ) {
                      res.data[1].children = children.data.result.filter(
                        i => i.id !== defaultExpandKey
                      );
                    }
                    return res;
                  })
              : res;
          })
          .then(res =>
            this.decorateWithSectorsAndDataset({
              data: { result: res.data }
            }).then(() => res)
          )
      : Promise.resolve(false);
    var defaultExpandedNodes;
    return Promise.all([
      axios(
        `${config.dataApi}dataset/${id}/tree?catalogueKey=${
          treeType === "gsd" ? catalogueKey : key
        }&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}`
      ).then(this.decorateWithSectorsAndDataset),
      p
    ])
      .then(values => {
        const mainTreeData = values[0].data.result;
        const rootTotal = values[0].data.total;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map(tx => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            childOffset: 0
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              confirmVisible={false}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={this.loadRoot}
              reloadChildren={() => this.fetchChildPage(dataRef, true)}
            />
          );
          return dataRef;
        });

        if (defaultExpanded && defaultExpanded.length == 0) {
          this.setState(
            {
              nodeNotFoundErr: (
                <span>
                  Cannot find taxon {defaultExpandKey} in tree &#128549;
                </span>
              )
            },
            () => {
              if (
                this.props.treeType === "mc" &&
                typeof this.props.addMissingTargetKey === "function"
              ) {
                this.props.addMissingTargetKey(defaultExpandKey);
              }
            }
          );
        }
        if (defaultExpanded && defaultExpanded.length > 0) {
          defaultExpandedNodes = _.map(defaultExpanded, "id");
          let root_ = _.find(treeData, [
            "key",
            defaultExpanded[defaultExpanded.length - 1].id
          ]);
          const nodes = defaultExpanded
            .slice(0, defaultExpanded.length - 1)
            .reverse();

          nodes.reduce((root, tx) => {
            let node = {
              taxon: tx,
              key: tx.id,
              childCount: tx.childCount,
              childOffset: 0
            };
            if (treeType === "gsd" && _.get(root, "taxon.sector")){
              tx.sectorKey = _.get(root, "taxon.sectorKey")
              tx.sector = _.get(root, "taxon.sector")
            } 
            node.title = (
              <ColTreeNode
                taxon={tx}
                datasetKey={id}
                treeType={this.props.treeType}
                showSourceTaxon={showSourceTaxon}
                reloadSelfAndSiblings={() => this.fetchChildPage(root, true)}
                reloadChildren={() => this.fetchChildPage(node, true)}
              />
            );

            root.children = _.get(root, "taxon.children")
              ? [
                  ...root.taxon.children.map(c => {
                    let ref = {
                      taxon: c,
                      key: c.id,
                      childCount: c.childCount,
                      childOffset: 0

                    }; 
                    if (treeType === "gsd" && _.get(root, "taxon.sector")){
                      c.sectorKey = _.get(root, "taxon.sectorKey")
                      c.sector = _.get(root, "taxon.sector")
                    } 
                    ref.title = (
                      <ColTreeNode
                        taxon={c}
                        treeType={this.props.treeType}
                        datasetKey={id}
                        showSourceTaxon={showSourceTaxon}
                        reloadSelfAndSiblings={() =>
                          this.fetchChildPage(root, true)
                        }
                        reloadChildren={() => this.fetchChildPage(ref, true)}
                      />
                    );
                    return ref;
                  }),
                  node
                ].sort((a, b) => {
                  if (a.taxon.rank === b.taxon.rank) {
                    return a.taxon.name < b.taxon.name
                      ? -1
                      : a.taxon.name > b.taxon.name
                      ? 1
                      : 0;
                  } else {
                    return (
                      this.props.rank.indexOf(a.taxon.rank) -
                      this.props.rank.indexOf(b.taxon.rank)
                    );
                  }
                })
              : [node];
            return node;
          }, root_);
        }
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData,...treeData],
            defaultExpandAll: !defaultExpanded && treeData.length < 10,
            error: null,
            defaultExpandedKeys: defaultExpandedNodes
          });
        } else {
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData, ...treeData],
            defaultExpandAll: treeData.length < 10,
            error: null
          });
          if (treeData.length === 1) {
            this.fetchChildPage(treeData[treeData.length - 1]);
          }
        }
      })
      .catch(err => {
        this.setState({
          treeData: [],
          rootLoading: false,
          defaultExpandedKeys: null,
          error: err
        });
      });
  }; */

  loadRoot = async () => {
    const {
      defaultExpandKey
    } = this.props;
    if(defaultExpandKey){
      this.expandToTaxon(defaultExpandKey)
    } else {
      this.loadRoot_()
    }
  }

  loadRoot_ = async () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      defaultExpandKey,
      catalogueKey,
      location
    } = this.props;
    this.setState({rootLoading: true, treeData: []})
    let id = key;
    return axios(
      `${config.dataApi}dataset/${id}/tree?catalogueKey=${
        treeType === "gsd" ? catalogueKey : key
      }&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}`
    ).then(this.decorateWithSectorsAndDataset)
      .then(res => {
        const mainTreeData = res.data.result;
        const rootTotal = res.data.total;
        const treeData = mainTreeData.map(tx => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            childOffset: 0
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              confirmVisible={false}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={this.loadRoot}
              reloadChildren={() => this.fetchChildPage(dataRef, true)}
            />
          );
          return dataRef;
        });
      
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData, ...treeData],
            expandedKeys: treeData.length < 10 ? treeData.map(n => n.taxon.id): [],
            error: null
          });
          if (treeData.length === 1) {
            this.fetchChildPage(treeData[treeData.length - 1]);
          }
        
      })
      .catch(err => {
        this.setState({
          treeData: [],
          rootLoading: false,
          expandedKeys: null,
          error: err
        });
      });
  };  

  expandToTaxon = async (defaultExpandKey) => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      catalogueKey,
      location
    } = this.props;
    this.setState({rootLoading: true, treeData: []})
    let id = key;
    const {data} = await axios(
          `${config.dataApi}dataset/${id}/tree/${
            defaultExpandKey
          }?catalogueKey=${treeType === "gsd" ? catalogueKey : key}`
        ).then(res =>
          this.decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )

    const tx = data[data.length-1]
    let root = {
      taxon: tx,
      key: tx.id,
      datasetKey: id,
      childCount: tx.childCount,
      childOffset: 0}
      root.title = (
        <ColTreeNode
          taxon={tx}
          datasetKey={id}
          confirmVisible={false}
          treeType={this.props.treeType}
          showSourceTaxon={showSourceTaxon}
          reloadSelfAndSiblings={this.loadRoot}
          reloadChildren={() => this.fetchChildPage(root, true)}
        />
      )

      const root_ = root;
      for(let i= data.length-2; i >= 0; i--){
        const tx = data[i];
        const node  = {
          taxon: tx,
          key: tx.id,
          datasetKey: id,
          childCount: tx.childCount,
          childOffset: 0}
          node.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              confirmVisible={false}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={this.loadRoot}
              reloadChildren={() => this.fetchChildPage(node, true)}
            />
          )

          root.children = [node];
          root = node;
      }

    const treeData = [
     root_
    ]

     const loadedKeys = [...data.map(t => t.id).reverse()]

     this.setState({treeData}, () => this.reloadLoadedKeys(loadedKeys))

  }

  fetchChildPage = (dataRef, reloadAll, dontUpdateState) => {
    const { showSourceTaxon, dataset, treeType, catalogueKey } = this.props;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");

    return axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${
        treeType === "gsd" ? catalogueKey : dataset.key
      }`
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
                  treeType={this.props.treeType}
                  reloadSelfAndSiblings={() =>
                    this.fetchChildPage(dataRef, true)
                  }
                  reloadChildren={() => this.fetchChildPage(childDataRef, true)}
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
              childCount: 0
            }
          ];
        }
        if(!dontUpdateState){
          this.setState({
            treeData: [...this.state.treeData]
          });
        }
        
        
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
              .load(r.subjectDatasetKey)
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


  findNode = (id, nodeArray) => {    
    let node = null;

    node = nodeArray.find((n)=> _.get(n, 'taxon.id') === id );

    if(node){
      return node;
    } else {
      const children = nodeArray.map(n => _.get(n, 'children') || [])
      const flattenedChildren = children.flat()
      if (flattenedChildren.length === 0){
        return null;
      } else {
        return this.findNode(id, flattenedChildren)
      }
    }
  
  }

  
  reloadLoadedKeys = async (keys) => {
    const {loadedKeys: storedKeys} = this.state;
    const {defaultExpandKey} = this.props;

    let {treeData} = this.state;
    const targetTaxon = defaultExpandKey ? this.findNode(defaultExpandKey, treeData) : null;
    const loadedKeys = keys || storedKeys;
    for (let index = 0; index < loadedKeys.length; index++) {
      const node = this.findNode(loadedKeys[index], treeData);
      if(node){
        await this.fetchChildPage(node, true, true)
        if(targetTaxon 
          && index === loadedKeys.length - 2 
          && _.isArray(node.children)  
          && !node.children.find(c => _.get(c, 'taxon.id') === _.get(targetTaxon, 'taxon.id')) ){
            if (
              node.children.length - 1 === CHILD_PAGE_SIZE){
              // its the parent of the taxon we are after - if its not in the first page, insert it
              node.children = [targetTaxon, ...node.children]
              this.setState({treeData: [...this.state.treeData]})
            } else {
              // It has gone missing from the tree
                this.setState(
                  {
                    nodeNotFoundErr: (
                      <span>
                        Cannot find taxon {defaultExpandKey} in tree &#128549;
                      </span>
                    )
                  },
                  () => {
                    if (
                      this.props.treeType === "mc" &&
                      typeof this.props.addMissingTargetKey === "function"
                    ) {
                      this.props.addMissingTargetKey(defaultExpandKey);
                    }
                  }
                ); 
            }
        }
      } 
    }
    this.setState({expandedKeys: loadedKeys, loadedKeys, rootLoading: false})
  }

  confirmAttach = (node, dragNode, mode) => {
    /*
       This is where sector mapping should be posted to the server
       */
    node.props.dataRef.title = (
      <ColTreeNode
        treeType={this.props.treeType}
        taxon={node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        isUpdating={true}
        confirmVisible={false}
        reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
        reloadChildren={node.props.title.props.reloadChildren}
      />
    );
    this.setState({ treeData: [...this.state.treeData] });
    this.props.attachFn(node, dragNode, mode).then(res => {
      node.props.dataRef.title = (
        <ColTreeNode
        treeType={this.props.treeType}

          taxon={node.props.title.props.taxon}
          datasetKey={this.props.dataset.key}
          isUpdating={false}
          confirmVisible={false}
          reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
          reloadChildren={node.props.title.props.reloadChildren}
        />
      );
      dragNode.props.dataRef.title.props.reloadSelfAndSiblings();
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
      message.warn("You cannot modify the CoL draft in attachment mode");
      return; // we are in modify mode and should not react to the event
    }
    if (
      e.node.props.dataRef.taxon.name === "Not assigned"
    ) {
      message.warn("You cannot create sectors on placeholder nodes");
      return; 
    }
    if (
      _.get(dragNode, "props.dataRef.taxon.sector") &&
      _.get(dragNode, "props.dataRef.taxon.id") ===
        _.get(dragNode, "props.dataRef.taxon.sector.subject.id")
    ) {
      message.warn(
        `Only one sector can be configured for each taxon. ${_.get(
          dragNode,
          "props.dataRef.taxon.sector.subject.name"
        )} -> ${_.get(
          dragNode,
          "props.dataRef.taxon.sector.target.name"
        )} is already defined as a sector `,
        6
      );
      return; // we are in modify mode and should not react to the event
    }

    const willProduceDuplicateChild = e.node.props.dataRef.children ? e.node.props.dataRef.children.find(c => c.taxon.name === dragNode.props.dataRef.taxon.name) : false;

    const { ranks } = this.state;

    const showRankWarning =
      !IRREGULAR_RANKS.includes(e.node.props.title.props.taxon.rank) &&
      !IRREGULAR_RANKS.includes(dragNode.props.title.props.taxon.rank) &&
      ranks.indexOf(dragNode.props.title.props.taxon.rank) <
        ranks.indexOf(e.node.props.title.props.taxon.rank);

    // default to attach mode
    let mode = "ATTACH";
    if (
      dragNode.props.title.props.taxon.rank ===
      e.node.props.title.props.taxon.rank
    ) {
      mode = "UNION";
    }
    const msg =
      mode === "ATTACH" ? (
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
              __html: dragNode.props.title.props.taxon.name
            }}
          />{" "}
          from {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.props.title.props.taxon.name
            }}
          />{" "}
          in this catalogue?
         {willProduceDuplicateChild && 
         <Alert 
         style={{marginTop: '6px'}} 
         type="error" 
         message={<div><span dangerouslySetInnerHTML={{__html: e.node.props.title.props.taxon.name}} /> already has a child named <span dangerouslySetInnerHTML={{__html: dragNode.props.dataRef.taxon.name}} /></div>} />}
        </span>
      ) : (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
          Ranks are equal. Do you want to replace or union children of{" "}
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
      treeType={this.props.treeType}

        taxon={e.node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        confirmVisible={true}
        confirmTitle={msg}
        reloadSelfAndSiblings={e.node.props.title.props.reloadSelfAndSiblings}
        reloadChildren={e.node.props.title.props.reloadChildren}
        actions={
          mode === "ATTACH"
            ? [
                {
                  text: "Ok",
                  action: () => this.confirmAttach(e.node, dragNode, mode)
                }
              ]
            : [
                {
                  text: "Union",
                  action: () => this.confirmAttach(e.node, dragNode, "UNION")
                },
                {
                  text: "Replace",
                  action: () => this.confirmAttach(e.node, dragNode, "REPLACE")
                }
              ]
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
              reloadChildren={e.node.props.title.props.reloadChildren}
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
      `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${draggedTaxon.id}`
    )
      .then(res => res.data)
      .then(draggedTaxon =>
        axios.put(
          `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${draggedTaxon.id}`,
          { ...draggedTaxon, parentId: parent.id }
        )
      )
      .then(res => {
        // TODO reload children for both nodes instead
        if (e.node.props.dataRef.children) {
          e.node.props.dataRef.children.push(e.dragNode.props.dataRef);
        } else {
          e.node.props.dataRef.children = [e.dragNode.props.dataRef];
        }
        _.remove(e.dragNode.props.dataRef.parent.children, function(n) {
          return n.key === e.dragNode.props.dataRef.key;
        });
        const oldParentName = e.dragNode.props.dataRef.parent.title.props.taxon.name;
        e.dragNode.props.dataRef.parent = e.node.props.dataRef;
        e.node.props.dataRef.title = (
          <ColTreeNode
          treeType={this.props.treeType}
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
                __html: oldParentName
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

    if (
      e.dragNode.props.dataRef.name === "Not assigned"
    ) {
      message.warn("You cannot move placeholder nodes");
      return; 
    }

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
        treeType={this.props.treeType}
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
              treeType={this.props.treeType}
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
      rootTotal,
      rootLoading,
      treeData,
      defaultExpandAll,
      nodeNotFoundErr,
      loadedKeys,
      expandedKeys
        } = this.state;
        console.log(loadedKeys)
    const { draggable, onDragStart, location, treeType, dataset } = this.props;
    return (
      <div>
        {" "}
        {error && (
          <React.Fragment>
          {  _.get(error, 'response.data.code') !== 404 ?
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          /> :
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginTop: "8px" }}
            message={<Custom404 error={error} treeType={treeType} dataset={dataset} loadRoot={this.loadRoot} />}
            type="warning"
          />

          }
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
        {treeData.length > 0 && (
          <ColTreeContext.Consumer>
            {({ mode }) => (
              <Tree
                showLine={true}
                defaultExpandAll={defaultExpandAll}
               // defaultExpandedKeys={defaultExpandedKeys}
                draggable={draggable}
                onDrop={e => this.handleDrop(e, mode)}
                onDragStart={onDragStart}
                loadData={this.onLoadData}
                onLoad={loadedKeys => this.setState({loadedKeys})}
                loadedKeys={loadedKeys}
                expandedKeys={expandedKeys}
                filterTreeNode={node =>
                  node.props.dataRef.key === this.props.defaultExpandKey
                }
                onExpand={(expandedKeys, obj) => {
                  this.setState({expandedKeys})
                  if (obj.expanded) {
                    if (_.get(obj, 'node.props.dataRef.childCount') > 0 ){
                      this.fetchChildPage(obj.node.props.dataRef, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams =
                      this.props.treeType === "mc"
                        ? {
                            ...params,
                            assemblyTaxonKey: obj.node.props.dataRef.key
                          }
                        : {
                            ...params,
                            sourceTaxonKey: obj.node.props.dataRef.key
                          };
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`
                    });
                  } else {
                    const key =
                      this.props.treeType === "mc"
                        ? "assemblyTaxonKey"
                        : "sourceTaxonKey";
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(qs.parse(_.get(location, "search")), [key])
                      )}`
                    });
                  }
                }}
              >
                {this.renderTreeNodes(treeData)}
              </Tree>
              
            )}
            
          </ColTreeContext.Consumer>
        )}
       {!error && treeData.length < rootTotal && <Button loading={rootLoading} onClick={this.loadRoot}>Load more </Button>}
      </div>
    );
  }
}

const mapContextToProps = ({ rank }) => ({ rank });

export default withContext(mapContextToProps)(ColTree);
