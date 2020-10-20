import React, {useEffect, useState, useRef} from "react";
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

const ColTree = (props) => {

  const [rootLoading, setRootLoading] = useState(true)
  const [treeData, setTreeData] = useState([])
  const [loadedKeys, setLoadedKeys] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [rootTotal, setRootTotal] = useState(0)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState("attach")
  const [nodeNotFoundErr, setNodeNotFoundErr] = useState(null)
  
  const { draggable, onDragStart, location, treeType, dataset } = props;


  let sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, props.catalogueKey));
  //loadRoot();
  // TODO what about the ref??? const { treeRef } = this.props;
  //  treeRef(this);

 
  useEffect(() => {
    reset()
  }, [_.get(props, 'dataset.key'), props.catalogueKey]);

  const reset = () => {
    sectorLoader = new DataLoader((ids) => getSectorsBatch(ids, props.catalogueKey));
    setTreeData([]);
    loadRoot()

  }




const reloadRoot = () => {
  setRootLoading(true)
  setTreeData([])
  setLoadedKeys([])
  setRootTotal(0)
  setError(null)
  setMode("attach")
  setNodeNotFoundErr(null)
  loadRoot()
}
  

  const loadRoot = async () => {
    const {
      defaultExpandKey
    } = props;
    if(defaultExpandKey){
      expandToTaxon(defaultExpandKey)
    } else {
      loadRoot_()
    }
  }

 const loadRoot_ = async () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      catalogueKey,
      onDeleteSector
    } = props;
    setRootLoading(true)
    setTreeData([])
    let id = key;
    return axios(
      `${config.dataApi}dataset/${id}/tree?catalogueKey=${
        catalogueKey
      }${appendTypeParam(treeType)}&limit=${CHILD_PAGE_SIZE}&offset=${treeData.length}`
    ).then(decorateWithSectorsAndDataset)
      .then(res => {
        const mainTreeData = res.data.result || [];
        const rootTotal = res.data.total;
        const treeData_ = mainTreeData.map(tx => {
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
              treeType={props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={loadRoot}
              reloadChildren={() => fetchChildPage(dataRef, true)}
            />
          );
          return dataRef;
        });
          setTreeData([...treeData, ...treeData_])
          setRootTotal(rootTotal)
          setRootLoading(false)
          setExpandedKeys(treeData_.length < 10 ? treeData_.map(n => n.taxon.id): [])
          setError(null)
          
          if (treeData.length === 1) {
            fetchChildPage(treeData[treeData.length - 1]);
          }
        
      })
      .catch(err => {
        setTreeData([])
          setRootLoading(false)
          setExpandedKeys([])
          setError(err)
        
      });
  };  
  const appendTypeParam = (treeType) => {
    return ["CATALOGUE", "SOURCE"].includes(treeType) ? `&type=${treeType}` : '';
  }
  const expandToTaxon = async (defaultExpandKey) => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      catalogueKey,
      onDeleteSector
    } = props;
    setRootLoading(true)
    setTreeData([])
    let id = key;
    const {data} = await axios(
          `${config.dataApi}dataset/${id}/tree/${
            defaultExpandKey
          }?catalogueKey=${catalogueKey}&&insertPlaceholder=true${appendTypeParam(treeType)}`
        ).then(res =>
          decorateWithSectorsAndDataset({
            data: { result: res.data }
          }).then(() => res)
        )

    if(data.length === 0){
      setError({message: `No classification found for Taxon ID: ${defaultExpandKey}`})
     return loadRoot_()
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
          treeType={props.treeType}
          showSourceTaxon={showSourceTaxon}
          reloadSelfAndSiblings={loadRoot}
          reloadChildren={() => fetchChildPage(root, true)}
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
          node.title = (
            <ColTreeNode
              taxon={tx}
              datasetKey={id}
              onDeleteSector={onDeleteSector}
              confirmVisible={false}
              treeType={props.treeType}
              showSourceTaxon={showSourceTaxon}
              reloadSelfAndSiblings={() =>
                fetchChildPage(root, true)
              }
              reloadChildren={() => fetchChildPage(node, true)}
            />
          )

          root.children = [node];
          root = node;
      }

    const treeData_ = [
     root_
    ]

     const loadedKeys_ = [...data.map(t => t.id).reverse()]
      setTreeData(treeData_)
      reloadLoadedKeys(loadedKeys_)

  }

  const fetchChildPage = (dataRef, reloadAll, dontUpdateState) => {
    const { showSourceTaxon, dataset, treeType, catalogueKey, onDeleteSector } = props;
    const childcount = _.get(dataRef, "childCount");
    const limit = CHILD_PAGE_SIZE;
    const offset = _.get(dataRef, "childOffset");

    return axios(
      `${config.dataApi}dataset/${dataset.key}/tree/${
        dataRef.taxon.id //taxonKey
      }/children?limit=${limit}&offset=${offset}&insertPlaceholder=true&catalogueKey=${
        catalogueKey
      }${appendTypeParam(treeType)}`
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
      .then(decorateWithSectorsAndDataset)
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
                  treeType={props.treeType}
                  reloadSelfAndSiblings={() =>
                    fetchChildPage(dataRef, true)
                  }
                  reloadChildren={() => fetchChildPage(childDataRef, true)}
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
            setTreeData([...treeData])
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
              isLeaf: true
            }
          ];
        }
        if(!dontUpdateState){
          setTreeData([...treeData])
        }
        
        
      });
  };

  const decorateWithSectorsAndDataset = res => {
    if (!res.data.result) return res;
    const {catalogueKey} = props
    return Promise.all(
      res.data.result
        .filter(tx => !!tx.sectorKey)
        .map(tx =>
          sectorLoader.load(tx.sectorKey, catalogueKey).then(r => {
            tx.sector = r;
            return datasetLoader
              .load(r.subjectDatasetKey)
              .then(dataset => (tx.sector.dataset = dataset));
          })
        )
    ).then(() => res);
  };

  const onLoadData = (treeNode, reloadAll = false) => {
    
    if (reloadAll) {
      treeNode.childOffset = 0;
    }

    return fetchChildPage(treeNode, reloadAll);
  };


  const findNode = (id, nodeArray) => {    
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
        return findNode(id, flattenedChildren)
      }
    }
  
  }

  
  const reloadLoadedKeys = async (keys) => {
    setRootLoading(true)
    const storedKeys = loadedKeys;
    const {defaultExpandKey} = props;

    //let {treeData} = this.state;
    const targetTaxon = defaultExpandKey ? findNode(defaultExpandKey, treeData) : null;
    const loadedKeys_ = keys ? [...keys] : [...storedKeys];
    for (let index = 0; index < loadedKeys_.length; index++) {
      let node = findNode(loadedKeys_[index], treeData);
      if (!node && targetTaxon && loadedKeys_[index-1]){
        // If the node is not found look for insertae sedis nodes in the children of the parent and insert the 'Not assigned' between the parent and the node 
        const parentNode = findNode(loadedKeys_[index-1], treeData);
        if(parentNode && _.isArray(_.get(parentNode, 'children')) && parentNode.children.length > 0) {
          node = parentNode.children.find(c => c.taxon.id.indexOf('incertae-sedis') > -1)
          loadedKeys_.splice(index, 0, node.taxon.id)
        } 
      }
      if(node){
        await fetchChildPage(node, true, true)
        if(targetTaxon 
          && index === loadedKeys_.length - 2 
          && _.get(node, 'taxon.id') !== _.get(targetTaxon, 'taxon.id')
          && _.isArray(node.children)  
          && !node.children.find(c => _.get(c, 'taxon.id') === _.get(targetTaxon, 'taxon.id')) ){
            if (
              node.children.length - 1 === CHILD_PAGE_SIZE){
              // its the parent of the taxon we are after - if its not in the first page, insert it
              node.children = [targetTaxon, ...node.children]
              setTreeData([...treeData])
            } else {
              // It has gone missing from the tree
                setNodeNotFoundErr({
                  nodeNotFoundErr: (
                    <span>
                      Cannot find taxon {defaultExpandKey} in tree &#128549;
                    </span>
                  )
                })
                if (
                  props.treeType === "CATALOGUE" &&
                  typeof props.addMissingTargetKey === "function"
                ) {
                  props.addMissingTargetKey(defaultExpandKey);
                }
                
            }
        }
      } 
    }
    setExpandedKeys(loadedKeys_)
    setLoadedKeys(loadedKeys_)
    setRootLoading(false)
  }

  const confirmAttach = (node, dragNode, mode) => {

    const {onDeleteSector} = props;
    /*
       This is where sector mapping should be posted to the server
       */
    node.title = (
      <ColTreeNode
        treeType={props.treeType}
        taxon={node.props.title.props.taxon}
        datasetKey={props.dataset.key}
        onDeleteSector={onDeleteSector}
        isUpdating={true}
        confirmVisible={false}
        reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
        reloadChildren={node.props.title.props.reloadChildren}
      />
    );
    setTreeData([...treeData])
    props.attachFn(node, dragNode, mode).then(res => {
      node.title = (
        <ColTreeNode
        treeType={props.treeType}

          taxon={node.props.title.props.taxon}
          datasetKey={props.dataset.key}
          onDeleteSector={onDeleteSector}
          isUpdating={false}
          confirmVisible={false}
          reloadSelfAndSiblings={node.props.title.props.reloadSelfAndSiblings}
          reloadChildren={node.props.title.props.reloadChildren}
        />
      );
      dragNode.title.props.reloadSelfAndSiblings();
      node.title.props.reloadSelfAndSiblings().then(() => {
        onLoadData(node, true);
      });
      //  .catch((err)=> alert(err));
    });
  };

 const handleAttach = e => {
    const { dragNode, onDeleteSector, rank } = props;
    const dragNodeIsPlaceholder =  dragNode.taxon.id.indexOf('incertae-sedis') > -1;
    const nodeIsPlaceholder = e.node.taxon.id.indexOf('incertae-sedis') > -1;
    const willProduceDuplicateChild = e.node.children && !dragNodeIsPlaceholder ? e.node.children.find(c => c.taxon.name === dragNode.taxon.name) : false;
    const taxonNameIsEqual = dragNode.taxon.name === e.node.taxon.name;
    if (
      dragNode.taxon.datasetKey ===
      e.node.taxon.datasetKey
    ) {
      message.warn("You cannot modify the COL draft in attachment mode");
      return; // we are in modify mode and should not react to the event
    }
    if (
      nodeIsPlaceholder
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


    const showRankWarning =
      !IRREGULAR_RANKS.includes(e.node.props.title.props.taxon.rank) &&
      !IRREGULAR_RANKS.includes(dragNode.props.title.props.taxon.rank) &&
      rank.indexOf(dragNode.props.title.props.taxon.rank) <
        rank.indexOf(e.node.props.title.props.taxon.rank);

    // default to attach mode
    let mode = "ATTACH";
    if (
      dragNode.props.title.props.taxon.rank ===
      e.node.props.title.props.taxon.rank
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
              __html: dragNode.props.title.props.taxon.name
            }}
          />{" "}
          from {dragNode.dataset.title} under{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.props.title.props.taxon.name
            }}
          />{" "}
          in this project?
          <br/>
          You may also choose to UNION.
         {willProduceDuplicateChild && 
         <Alert 
         style={{marginTop: '6px'}} 
         type="error" 
         message={<div><span dangerouslySetInnerHTML={{__html: e.node.props.title.props.taxon.name}} /> already has a child named <span dangerouslySetInnerHTML={{__html: dragNode.taxon.name}} /></div>} />}
        </span>
      ) : (
        <span>
          {showRankWarning && (
            <Alert
              message="Subject rank is higher than target rank"
              type="warning"
            />
          )}
         {dragNodeIsPlaceholder ? `Insert all taxa with no ${dragNode.props.title.props.taxon.rank} assigned `: `Ranks are equal. Do you want to ${taxonNameIsEqual ? 'replace or ':''}union children of `}
         {!dragNodeIsPlaceholder && <span
            dangerouslySetInnerHTML={{
              __html: dragNode.props.title.props.taxon.name
            }}
          />}{" "}
          in {dragNode.dataset.title} into children of{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: e.node.props.title.props.taxon.name
            }}
          />{" "}
        </span>
      );
    const unionOptions = dragNodeIsPlaceholder ? [
      {
        text: "Union",
        action: () => confirmAttach(e.node, dragNode, "UNION")
      }
    ] : taxonNameIsEqual ? [
      {
        text: "Attach",
        type: "dashed",
        action: () => confirmAttach(e.node, dragNode, "ATTACH")
      },
      {
        text: "Replace",
        type: "danger",
        action: () => confirmAttach(e.node, dragNode, "REPLACE")
      },
      
      {
        text: "Union",
        type: "primary",
        action: () => confirmAttach(e.node, dragNode, "UNION")
      }
    ] : [
      {
        text: "Attach",
        type: "dashed",
        action: () => confirmAttach(e.node, dragNode, "ATTACH")
      },     
      {
        text: "Union",
        type: "primary",
        action: () => confirmAttach(e.node, dragNode, "UNION")
      }
    ]
    e.node.title = (
      <ColTreeNode
        treeType={props.treeType}
        taxon={e.node.props.title.props.taxon}
        datasetKey={props.dataset.key}
        onDeleteSector={onDeleteSector}
        confirmVisible={true}
        confirmTitle={msg}
        reloadSelfAndSiblings={e.node.props.title.props.reloadSelfAndSiblings}
        reloadChildren={e.node.props.title.props.reloadChildren}
        actions={
          mode === "ATTACH"
            ? [
                
                {
                  text: "Union",
                  type: "dashed",
                  action: () => confirmAttach(e.node, dragNode, "UNION")
                },
                {
                  text: "Attach",
                  type: "primary",
                  action: () => confirmAttach(e.node, dragNode, "ATTACH")
                }
              ]
            : unionOptions
        }
        onCancel={() => {
          e.node.title = (
            <ColTreeNode
              taxon={e.node.props.title.props.taxon}
              datasetKey={props.dataset.key}
              onDeleteSector={onDeleteSector}
              confirmVisible={false}
              reloadSelfAndSiblings={
                e.node.props.title.props.reloadSelfAndSiblings
              }
              reloadChildren={e.node.props.title.props.reloadChildren}
            />
          );
          setTreeData([...treeData])
        }}
      />
    );
    console.log(
      dragNode.title.props.taxon.name +
        " --> " +
        e.node.title.props.taxon.name
    );
    setTreeData([...treeData])
  };

 const confirmModify = e => {
    const {onDeleteSector} = props;
    const parent = e.node.title.props.taxon;
    const draggedTaxon = e.dragNode.title.props.taxon;
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
        if (e.node.children) {
          e.node.children.push(e.dragNode);
        } else {
          e.node.children = [e.dragNode];
        }
        _.remove(e.dragNode.parent.children, function(n) {
          return n.key === e.dragNode.key;
        });
        const oldParentName = e.dragNode.parent.title.props.taxon.name;
        e.dragNode.parent = e.node;
        e.node.title = (
          <ColTreeNode
            treeType={props.treeType}
            taxon={e.node.props.title.props.taxon}
            datasetKey={props.dataset.key}
            onDeleteSector={onDeleteSector}
            confirmVisible={false}
            reloadSelfAndSiblings={
              e.node.props.title.props.reloadSelfAndSiblings
            }
            reloadChildren={e.node.props.title.props.reloadChildren}
          />
        );
        let msg = (
          <span>
            You moved{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: e.dragNode.name
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
                __html: e.node.title.props.taxon.name
              }}
            />
          </span>
        );
        setTreeData([...treeData])
        notification.open({
          message: "Taxon moved",
          description: msg
        });
        
      })
      .catch(err => {
        alert(err);
      });
  };
 const handleModify = e => {
    const {onDeleteSector} = props
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
            __html: e.node.title.props.taxon.name
          }}
        />
        ?
      </span>
    );
    e.node.title = (
      <ColTreeNode
        taxon={e.node.props.title.props.taxon}
        treeType={props.treeType}
        datasetKey={props.dataset.key}
        onDeleteSector={onDeleteSector}
        reloadSelfAndSiblings={
          e.node.props.title.props.reloadSelfAndSiblings
        }
        reloadChildren={e.node.props.title.props.reloadChildren}
        confirmVisible={true}
        confirmTitle={msg}
        onConfirm={() => {
          confirmModify(e);
        }}
        onCancel={() => {
          e.node.title = (
            <ColTreeNode
              taxon={e.node.props.title.props.taxon}
              treeType={props.treeType}
              datasetKey={props.dataset.key}
              onDeleteSector={onDeleteSector}
              reloadSelfAndSiblings={
                e.node.props.title.props.reloadSelfAndSiblings
              }
              reloadChildren={e.node.props.title.props.reloadChildren}
              confirmVisible={false}
            />
          );
          setTreeData([...treeData])
        }}
      />
    );
    setTreeData([...treeData])
  };
  const handleDrop = (e, mode) => {
    const { treeType } = props;
    if (treeType !== "CATALOGUE") {
      return;
    }
    if (mode === "attach") {
      handleAttach(e);
    } else if (mode === "modify") {
      handleModify(e);
    }
  };


    return (
      <div>
       
        {error && (
          <React.Fragment>
          {  _.get(error, 'response.data.code') !== 404 ?
          <Alert
            closable
            onClose={() => setError(null)}
            style={{ marginTop: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          /> :
          <Alert
            closable
            onClose={() => setError(null)}
            style={{ marginTop: "8px" }}
            message={<Custom404 error={error} treeType={treeType} dataset={dataset} loadRoot={loadRoot} />}
            type="warning"
          />

          }
          </React.Fragment>
        )}
        {nodeNotFoundErr && (
          <Alert
            closable
            onClose={() => setNodeNotFoundErr(null)}
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
               // defaultExpandedKeys={defaultExpandedKeys}
                draggable={draggable}
                onDrop={e => handleDrop(e, mode)}
                onDragStart={onDragStart}
                loadData={onLoadData}
                onLoad={setLoadedKeys}
                loadedKeys={loadedKeys}
                expandedKeys={expandedKeys}
                treeData={treeData}
                filterTreeNode={node =>
                  node.key === props.defaultExpandKey
                }
                onExpand={(expandedKeys, obj) => {
                  setExpandedKeys(expandedKeys)
                  if (obj.expanded) {
                    if (_.get(obj, 'node.childCount') > 0 ){
                     // this.fetchChildPage(obj.node, true)
                    }
                    const params = qs.parse(_.get(location, "search"));
                    const newParams =
                      props.treeType === "CATALOGUE"
                        ? {
                            ...params,
                            assemblyTaxonKey: obj.node.key
                          }
                        : {
                            ...params,
                            sourceTaxonKey: obj.node.key
                          };
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(newParams)}`
                    });
                  } else {
                    const key =
                      props.treeType === "CATALOGUE"
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
                
              </Tree>
              
            )}
            
          </ColTreeContext.Consumer>
        )}
       {!error && treeData.length < rootTotal && <Button loading={rootLoading} onClick={loadRoot}>Load more </Button>}
      </div>
    );
  
}

const mapContextToProps = ({ rank }) => ({ rank });

export default withContext(mapContextToProps)(ColTree);
