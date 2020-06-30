import React from "react";
import { Tree, notification, message, Alert, Spin, Button, Skeleton } from "antd";
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

const TAXON_KEY_PARAMETER_NAMES = {
  "CATALOGUE": "assemblyTaxonKey",
  "SOURCE": "sourceTaxonKey",
  "readOnly": "taxonKey"
}

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
    this.sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, this.props.catalogueKey));
    const { treeRef } = this.props;
    treeRef(this);
  };


  componentDidUpdate = (prevProps) => {
    if (prevProps.dataset.key !== this.props.dataset.key || prevProps.catalogueKey !== this.props.catalogueKey) {
      this.setState({ treeData: [] }, this.loadRoot);
      this.sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, this.props.catalogueKey));

    }
   
  }


  reloadRoot = () => this.setState({ rootLoading: true,
    treeData: [],
    loadedKeys: [],
    rootTotal: 0,
    error: null,
    mode: "attach",
    nodeNotFoundErr: null }, this.loadRoot);
  

  loadRoot = async () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      catalogueKey,
      onDeleteSector,
      defaultExpandKey
    } = this.props;
    this.setState({rootLoading: true, treeData: []})
    let id = key;
    return axios(
      `${config.dataApi}dataset/${id}/tree?catalogueKey=${
        catalogueKey
      }${this.appendTypeParam(treeType)}&limit=${CHILD_PAGE_SIZE}&offset=${this.state.treeData.length}`
    ).then(this.decorateWithSectorsAndDataset)
      .then(res => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const treeData = mainTreeData.map(tx => {
          let dataRef = {
            taxon: tx,
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            isLeaf: tx.childCount === 0,
            childOffset: 0
          };
          dataRef.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              confirmVisible={false}
              onDeleteSector={onDeleteSector}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={() => {
                const loadedChildIds = dataRef.children ? dataRef.children.filter(c => c.children && c.children.length > 0).map(c => c.key) : null;
                this.loadRoot().then(() => loadedChildIds? this.reloadLoadedKeys(loadedChildIds, false) : false)
              }}
              reloadChildren={() => {
                this.fetchChildPage(dataRef, true)
              }}
            />
          );
          dataRef.ref = dataRef;
          return dataRef;
        });
      
          this.setState({
            rootTotal: rootTotal,
            rootLoading: false,
            treeData:[...this.state.treeData, ...treeData],
            expandedKeys: !defaultExpandKey && treeData.length < 10 ? treeData.map(n => n.taxon.id): [],
            error: null
          }, () => {
            if(defaultExpandKey){
              return this.expandToTaxon(defaultExpandKey)
             }
          });

        
      })
      .catch(err => {
        this.setState({
          treeData: [],
          rootLoading: false,
          expandedKeys: [],
          error: err
        });
      });
  };  
  appendTypeParam = (treeType) => {
    return ["CATALOGUE", "SOURCE"].includes(treeType) ? `&type=${treeType}` : '';
  }
  expandToTaxon = async (defaultExpandKey) => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      catalogueKey,
      onDeleteSector
    } = this.props;
    this.setState({rootLoading: true})
    let id = key;
    const {data} = await axios(
          `${config.dataApi}dataset/${id}/tree/${
            defaultExpandKey
          }?catalogueKey=${catalogueKey}&&insertPlaceholder=true${this.appendTypeParam(treeType)}`
        ).then(res =>
          this.decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )

    if(data.length === 0){
      return this.setState({error: {message: `No classification found for Taxon ID: ${defaultExpandKey}`}}, this.loadRoot_)
    }    
    const tx = data[data.length-1]
    let root = {
      taxon: tx,
      key: tx.id,
      datasetKey: id,
      childCount: tx.childCount,
      isLeaf: tx.childCount === 0,
      childOffset: 0}
      root.title = (
        <ColTreeNode
          taxon={tx}
          datasetKey={id}
          onDeleteSector={onDeleteSector}
          confirmVisible={false}
          treeType={this.props.treeType}
          showSourceTaxon={showSourceTaxon}
          reloadSelfAndSiblings={() => {
            const loadedChildIds = root.children ? root.children.filter(c => c.children && c.children.length > 0).map(c => c.key) : null;
            this.loadRoot().then(() => loadedChildIds? this.reloadLoadedKeys(loadedChildIds, false) : false)
          }}
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
          isLeaf: tx.childCount === 0,
          childOffset: 0}
          node.ref = node;
          node.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              onDeleteSector={onDeleteSector}
              confirmVisible={false}
              treeType={this.props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={() => {
                const loadedChildIds = root.children ? root.children.filter(c => c.children && c.children.length > 0).map(c => c.key) : null;
                return this.fetchChildPage(root, true).then(() => loadedChildIds? this.reloadLoadedKeys(loadedChildIds, false) : false)
              }}
              reloadChildren={() => this.fetchChildPage(node, true)}
            />
          )

          root.children = [node];
          root = node;
      }

    const {treeData} = this.state;
    var rootIndex = treeData.findIndex(x => x.key == root_.key);
    treeData[rootIndex] = root_;

     const loadedKeys = [...data.map(t => t.id).reverse()]

     this.setState({treeData, rootLoading:false}, () => this.reloadLoadedKeys(loadedKeys))

  }
  
  fetchChildPage = (dataRef, reloadAll, dontUpdateState) => {
    const { showSourceTaxon, dataset, treeType, catalogueKey, onDeleteSector } = this.props;
    const {treeData} = this.state;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");
    
    return axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${
        catalogueKey
      }${this.appendTypeParam(treeType)}`
    )
      .then(res => {
        if (_.get(res, 'data.empty') !== true && treeType === "SOURCE" && _.get(dataRef, "taxon.sectorKey")) {
          // If it is a source and the parent has a sectorKey, copy it to children
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
                isLeaf: tx.childCount === 0,
                childOffset: 0,
                parent: dataRef,
                name: tx.name
              };

              childDataRef.title = (
                <ColTreeNode
                  confirmVisible={false}
                  taxon={tx}
                  datasetKey={dataset.key}
                  onDeleteSector={onDeleteSector}
                  treeType={this.props.treeType}
                  reloadSelfAndSiblings={() => {
                    const loadedChildIds = dataRef.children ? dataRef.children.filter(c => c.children && c.children.length > 0).map(c => c.key) : null;
                    return this.fetchChildPage(dataRef, true).then(() => loadedChildIds? this.reloadLoadedKeys(loadedChildIds, false) : false)
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
      .then(data => {
        // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
        dataRef.children =
          dataRef.children && offset !== 0 && !reloadAll
            ? [...dataRef.children, ...data]
            : data;
        dataRef.isLeaf =  !dataRef.children ||    dataRef.children.length === 0;
        dataRef.taxon.firstChildRank = _.get(dataRef, 'children[0].taxon.rank')
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
              childCount: 0,
              isLeaf: true
            }
          ];
        }
        if(!dontUpdateState){
          this.setState({
            treeData: [...treeData],
            loadedKeys: [...new Set([...this.state.loadedKeys, dataRef.key])]
          });
        }
        
        
      });
  };

  decorateWithSectorsAndDataset = res => {
    if (!res.data.result) return res;
    const {catalogueKey} = this.props
    return Promise.all(
      res.data.result
        .filter(tx => !!tx.sectorKey)
        .map(tx =>
          this.sectorLoader.load(tx.sectorKey, catalogueKey).then(r => {
            tx.sector = r;
            return datasetLoader
              .load(r.subjectDatasetKey)
              .then(dataset => (tx.sector.dataset = dataset));
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

    node = nodeArray.find((n)=> !findByName ? _.get(n, 'taxon.id') === id  : _.get(n, 'taxon.name') === id )

    if(node){
      return node;
    } else {
      const children = nodeArray.map(n => _.get(n, 'children') || [])
      const flattenedChildren = children.flat()
      if (flattenedChildren.length === 0){
        return null;
      } else {
        return this.findNode(id, flattenedChildren, findByName)
      }
    }
  
  }

  
  reloadLoadedKeys = async (keys, expandAll = true) => {
    this.setState({rootLoading: true})
    const {loadedKeys: storedKeys} = this.state;
    const {defaultExpandKey} = this.props;

    let {treeData} = this.state;
    const targetTaxon = defaultExpandKey ? this.findNode(defaultExpandKey, treeData) : null;
    const loadedKeys = keys ? [...keys] : [...storedKeys];
    for (let index = 0; index < loadedKeys.length; index++) {
      let node = this.findNode(loadedKeys[index], treeData);
      if (!node && targetTaxon && loadedKeys[index-1]){
        // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node 
        const parentNode = this.findNode(loadedKeys[index-1], treeData);
        if(parentNode && _.isArray(_.get(parentNode, 'children')) && parentNode.children.length > 0) {
          node = parentNode.children.find(c => c.taxon.id.indexOf('incertae-sedis') > -1)
          loadedKeys.splice(index, 0, node.taxon.id)
        } 
      }
      if(node){
        await this.fetchChildPage(node, true, true)
        if(targetTaxon 
          && index === loadedKeys.length - 2 
          && _.get(node, 'taxon.id') !== _.get(targetTaxon, 'taxon.id')
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
    }
    const newState =  {loadedKeys, rootLoading: false};
    if (expandAll) {
      newState.expandedKeys = loadedKeys;
    }
    this.setState(newState)
  }

  confirmAttach = (node, dragNode, mode) => {

    const { attachFn} = this.props;
    /*
       This is where sector mapping should be posted to the server
       */
    node.title = React.cloneElement(node.title, {isUpdating: true})
    
    this.setState({ treeData: [...this.state.treeData] });
    attachFn(node, dragNode, mode).then(res => {
      
      dragNode.title.props.reloadSelfAndSiblings();
      node.title.props.reloadSelfAndSiblings().then(() => {
        const newNodeReference = mode === "REPLACE" ? this.findNode(dragNode.taxon.name, node.parent.children, true ) : this.findNode(node.taxon.id, node.parent.children );
        this.fetchChildPage(newNodeReference, true).then(()=> node.title = React.cloneElement(node.title, {isUpdating: false})
        );
      })
      .catch((err)=> {
        console.log(err)
        alert(err)});
      //  .catch((err)=> alert(err));
    });
  };

  handleAttach = e => {
    const dragNode = this.props.dragNode.ref;
    const {node} = e;
    const { rank } = this.props;
    const dragNodeIsPlaceholder =  dragNode.taxon.id.indexOf('incertae-sedis') > -1;
    const nodeIsPlaceholder = node.taxon.id.indexOf('incertae-sedis') > -1;
    const willProduceDuplicateChild = node.children && !dragNodeIsPlaceholder ? node.children.find(c => c.taxon.name === dragNode.taxon.name) : false;
    const taxonNameIsEqual = dragNode.taxon.name === node.taxon.name;
    if (
      dragNode.taxon.datasetKey ===
      node.taxon.datasetKey
    ) {
      message.warn("You cannot modify the CoL draft in attachment mode");
      return; // we are in modify mode and should not react to the event
    }
    if (
      nodeIsPlaceholder
    ) {
      message.warn("You cannot create sectors on placeholder nodes");
      return; 
    }
    if (
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
    }


    const showRankWarning =
      !IRREGULAR_RANKS.includes(node.taxon.rank) &&
      !IRREGULAR_RANKS.includes(dragNode.taxon.rank) &&
      rank.indexOf(dragNode.taxon.rank) <
        rank.indexOf(node.taxon.rank);

    // default to attach mode
    let mode = "ATTACH";
    if (
      dragNode.taxon.rank ===
      node.taxon.rank
    ) {
      mode = "UNION";
    }
    if (dragNodeIsPlaceholder){
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
              __html: dragNode.taxon.name
            }}
          />{" "}
          from {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: node.taxon.name
            }}
          />{" "}
          in this project?
          <br/>
          You may also choose to UNION.
         {willProduceDuplicateChild && 
         <Alert 
         style={{marginTop: '6px'}} 
         type="error" 
         message={<div><span dangerouslySetInnerHTML={{__html: node.taxon.name}} /> already has a child named <span dangerouslySetInnerHTML={{__html: dragNode.taxon.name}} /></div>} />}
        </span>
      ) : (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
         {dragNodeIsPlaceholder ? `Insert all taxa with no ${dragNode.taxon.rank} assigned `: `Ranks are equal. Do you want to ${taxonNameIsEqual ? 'replace or ':''}union children of `}
         {!dragNodeIsPlaceholder && <span
            dangerouslySetInnerHTML={{
              __html: dragNode.taxon.name
            }}
          />}{" "}
          in {dragNode.dataset.title} into children of{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.taxon.name
            }}
          />{" "}
        </span>
      );
    const unionOptions = dragNodeIsPlaceholder ? [
      {
        text: "Union",
        action: () => this.confirmAttach(node, dragNode, "UNION")
      }
    ] : taxonNameIsEqual ? [
      {
        text: "Attach",
        type: "dashed",
        action: () => this.confirmAttach(node, dragNode, "ATTACH")
      },
      {
        text: "Replace",
        type: "danger",
        action: () => this.confirmAttach(node, dragNode, "REPLACE")
      },
      
      {
        text: "Union",
        type: "primary",
        action: () => this.confirmAttach(node, dragNode, "UNION")
      }
    ] : [
      {
        text: "Attach",
        type: "dashed",
        action: () => this.confirmAttach(e.node, dragNode, "ATTACH")
      },     
      {
        text: "Union",
        type: "primary",
        action: () => this.confirmAttach(node, dragNode, "UNION")
      }
    ]

    const nodeTitle = React.cloneElement(node.ref.title);
    node.ref.title = React.cloneElement(node.ref.title, {confirmVisible: true, confirmTitle: msg, actions: mode === "ATTACH"
    ? [
        
        {
          text: "Union",
          type: "dashed",
          action: () => this.confirmAttach(node, dragNode, "UNION")
        },
        {
          text: "Attach",
          type: "primary",
          action: () => this.confirmAttach(node, dragNode, "ATTACH")
        }
      ]
    : unionOptions,
    onCancel: () => {
      node.ref.title = nodeTitle;
      this.setState({ treeData: [...this.state.treeData] });
    }
  })    

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
      .then(res => res.data)
      .then(draggedTaxon =>
        axios.put(
          `${config.dataApi}dataset/${draggedTaxon.datasetKey}/taxon/${draggedTaxon.id}`,
          { ...draggedTaxon, parentId: parent.id }
        )
      )
      .then(res => {
       
        _.remove(dragNode.parent.children, function(n) {
          return n.key === dragNode.key;
        });
        dragNode.parent.childCount --;
        dragNode.parent.isLeaf = dragNode.parent.childCount === 0;
        node.title.props.reloadChildren().then(() => {
          node.childCount ++;
          node.isLeaf = node.childCount === 0;
        })
        
        const oldParentName = dragNode.parent.taxon.name;
        dragNode.parent = node;
        node.title = nodeTitle;
        let msg = (
          <span>
            You moved{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: dragNode.name
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
                __html: node.taxon.name
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
      e.dragNode.name === "Not assigned"
    ) {
      message.warn("You cannot move placeholder nodes");
      return; 
    }

    const msg = (
      <span>
        Move{" "}
        <span
          dangerouslySetInnerHTML={{ __html: e.dragNode.name }}
        />{" "}
        from parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.dragNode.parent.title.props.taxon.name
          }}
        />{" "}
        to parent{" "}
        <span
          dangerouslySetInnerHTML={{
            __html: e.node.ref.title.props.taxon.name
          }}
        />
        ?
      </span>
    );
    const nodeTitle = React.cloneElement(e.node.ref.title)
    e.node.ref.title = React.cloneElement(e.node.ref.title, {confirmVisible: true, confirmTitle: msg, onConfirm: () => {
      this.confirmModify(e, nodeTitle);
    },
    onCancel: () => {e.node.ref.title = nodeTitle}
    
    })
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
      expandedKeys
        } = this.state;
    const { draggable, onDragStart, location, treeType, dataset } = this.props;
    return (
      <div>
       
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
        {rootLoading &&  <Skeleton paragraph={{rows: 10}} active />}
        {!rootLoading && treeData.length > 0 && (
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
                selectedKeys={false}
                treeData={treeData}
                filterTreeNode={node =>
                  node.key === this.props.defaultExpandKey
                }
                onExpand={(expandedKeys, obj) => {
                  this.setState({expandedKeys})
                  if (obj.expanded) {
                    if (_.get(obj, 'node.childCount') > 0 ){
                     // this.fetchChildPage(obj.node, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams = {...params, [TAXON_KEY_PARAMETER_NAMES[treeType]] : obj.node.key}
                     
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`
                    });
                  } else {
                    const key = TAXON_KEY_PARAMETER_NAMES[treeType];
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(qs.parse(_.get(location, "search")), [key])
                      )}`
                    });
                  }
                }}
              />
                              
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
