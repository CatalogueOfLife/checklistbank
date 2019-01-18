import React from "react";
import { Tree, notification, message, Alert, Spin } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import colTreeActions from "./ColTreeActions";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../../components/ErrorMsg";
const TreeNode = Tree.TreeNode;
const CHILD_PAGE_SIZE = 100 // How many children will we load at a time

class LoadMoreChildrenTreeNode extends React.Component {
  constructor(props) {
      super(props);
      this.state = { loading: false }
  }

  onClick = () => {
      this.setState({ loading: true })
      this.props.onClick();
  }
  render = () => {
      const { loading } = this.state;
      return (
          <div>
              {loading && <Spin />}
              {!loading && <a onClick={this.onClick}>
                  <strong>Load more...</strong>
              </a>}
          </div>

      )
  }
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
    axios(`${config.dataApi}vocab/rank`).then((res)=>{
      this.setState({ranks: res.data.map(e => e.name )})
    })
  }
  loadRoot = () => {
    const {
      treeType,
      dataset: { key },
      showSourceTaxon,
      defaultExpandKey
    } = this.props;
    let id = key;
    let p = defaultExpandKey
      ? axios(`${config.dataApi}dataset/${id}/tree/${encodeURIComponent(defaultExpandKey)}`)
      : Promise.resolve(false);
    var defaultExpandedNodes;
    return Promise.all([axios(`${config.dataApi}dataset/${id}/tree`), p])
      .then(values => {
        const mainTreeData = values[0].data.result;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map( tx => {
          return {
            title: (
              <ColTreeNode
                taxon={tx}
                datasetKey={id}
                confirmVisible={false}
                hasPopOver={this.props.treeType === "mc"}
                showSourceTaxon={showSourceTaxon}
                reloadSelfAndSiblings={() => 
                  this.loadRoot()
                }
              />
            ),
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            childOffset: 0
          };
        });
        if (defaultExpanded) {
          defaultExpandedNodes = _.map(defaultExpanded, "id");
          let root = _.find(treeData, [
            "key",
            defaultExpanded[defaultExpanded.length - 1].id
          ]);
          for (let i = defaultExpanded.length - 2; i > -1; i--) {
            let tx = defaultExpanded[i];
            // if MC should have default selected remember to insert function attrs here
            let node = {
              title: <ColTreeNode taxon={tx} datasetKey={id} />,
              key: tx.id,
              childCount: tx.childCount,
              childOffset: 0,
              taxon: tx
            };
            root.children = [node];
            root = node;
          }
        }
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            treeData: (treeType === "mc") ? [...treeData] : treeData.filter(r => r.childCount > 0),
            defaultExpandAll:
              !defaultExpanded && treeType !== "mc" && treeData.length < 10,
            error: null,
            defaultExpandedKeys: defaultExpandedNodes
          });
        } else {
          this.setState({
            treeData: (treeType === "mc") ? [...treeData] : treeData.filter(r => r.childCount > 0),
            defaultExpandAll: treeType !== "mc" && treeData.length < 10,
            error: null
          });
        }
      })
      .catch(err => {
        this.setState({ treeData: [], defaultExpandedKeys: null, error: err });
      });
  };
  fetchChildPage = (treeNode, datasetKey, taxonKey, offset, limit) => {
    const {showSourceTaxon} = this.props;
    return axios(
      `${config.dataApi}dataset/${datasetKey}/tree/${encodeURIComponent(taxonKey)}/children?limit=${limit}&offset=${offset}`
    ).then(res => (res.data.result ? res.data.result.map( tx => {
      return {
        title: (
          <ColTreeNode
            confirmVisible={false}
            taxon={tx}
            datasetKey={datasetKey}
            hasPopOver={this.props.treeType === "mc"}
            reloadSelfAndSiblings={() => 
              this.onLoadData(treeNode, true)
            }
            showSourceTaxon={showSourceTaxon}
          />
        ),
        key: tx.id,
        datasetKey: datasetKey,
        childCount: tx.childCount,
        childOffset: 0,
        parent: treeNode.props.dataRef,
        name: tx.name
      };
    }): [])) 
  }

  onLoadData = (treeNode, reloadAll = false) => {
    const {
      dataset: { key }
    } = this.props;
    let id = key;
    if(reloadAll){
      treeNode.props.dataRef.childOffset = 0;
    }
    const childcount = _.get(treeNode, 'props.dataRef.childCount')
    const offset = _.get(treeNode, 'props.dataRef.childOffset');
    return this.fetchChildPage(treeNode, id, treeNode.props.eventKey, offset, CHILD_PAGE_SIZE)
            .then(data => {
              // reloadAll is used to force reload all children from offset 0 - used when new children have been posted
              treeNode.props.dataRef.children = treeNode.props.dataRef.children && offset !== 0 && !reloadAll ? [...treeNode.props.dataRef.children, ...data] : data;

              if ((offset + CHILD_PAGE_SIZE) < childcount) {
                const loadMoreFn = () => {
                    treeNode.props.dataRef.childOffset += CHILD_PAGE_SIZE;
                    if (treeNode.props.dataRef.children[treeNode.props.dataRef.children.length - 1].key === '__loadMoreBTN__') {
                        treeNode.props.dataRef.children = treeNode.props.dataRef.children.slice(0, -1)
                    }
                    this.setState({
                      treeData: [...this.state.treeData],
                      defaultExpandAll: false
                    }, ()=>{this.onLoadData(treeNode)});
                    
                }
                treeNode.props.dataRef.children = [...treeNode.props.dataRef.children, { title: <LoadMoreChildrenTreeNode onClick={loadMoreFn} key="__loadMoreBTN__"></LoadMoreChildrenTreeNode>, key: '__loadMoreBTN__', childCount:0 }]
            }
              this.setState({
                treeData: [...this.state.treeData],
                defaultExpandAll: false
              });
            })

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
      node.props.dataRef.title.props.reloadSelfAndSiblings().then(()=> this.onLoadData(node, true))

    });
  };

  handleAttach = e => {
    if (this.props.dragNode.props.datasetKey === e.node.props.datasetKey) {
      message.warn(
        "You cant modify the CoL draft in attachment mode"
      );
      return; // we are in modify mode and should not react to the event
    }
    const { ranks } = this.state;
    if(ranks.indexOf(this.props.dragNode.props.title.props.taxon.rank) < ranks.indexOf(e.node.props.title.props.taxon.rank)){
      message.warn(
        "Subject rank is higher than target rank"
      );
      return;
    }
    // default to attach mode
    let mode = "ATTACH";
    if (
      this.props.dragNode.props.title.props.taxon.rank ===
      e.node.props.title.props.taxon.rank
    ) {
      mode = 'MERGE'      
    }
    const msg = (mode === 'ATTACH') ? 
    <span>Attach <span dangerouslySetInnerHTML={{__html: this.props.dragNode.props.title.props.taxon.name}} /> from {this.props.dragNode.dataset.title} under <span dangerouslySetInnerHTML={{__html: e.node.props.title.props.taxon.name}} /> in {this.props.dataset.title}?</span> : 
    <span>Ranks are equal, this will merge children of <span dangerouslySetInnerHTML={{__html: this.props.dragNode.props.title.props.taxon.name}} /> in {this.props.dragNode.dataset.title} into children of <span dangerouslySetInnerHTML={{__html: e.node.props.title.props.taxon.name}} /> in {this.props.dataset.title}
    </span>

    e.node.props.dataRef.title = (
      <ColTreeNode
        taxon={e.node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        confirmVisible={true}
        confirmTitle={msg}
        reloadSelfAndSiblings={e.node.props.title.props.reloadSelfAndSiblings}
        onConfirm={() => {
          this.confirmAttach(e.node, this.props.dragNode, mode);
        }}
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
      this.props.dragNode.props.dataRef.title.props.taxon.name +
        " --> " +
        e.node.props.dataRef.title.props.taxon.name
    );
    this.setState({ treeData: [...this.state.treeData] });
  };
  confirmModify = e => {
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
    let msg = `You moved ${e.dragNode.props.dataRef.name} from parent ${
      e.dragNode.props.dataRef.parent.title.props.taxon.name
    } to parent ${e.node.props.dataRef.title.props.taxon.name}`;
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
  };
  handleModify = e => {
    const msg = `Move ${e.dragNode.props.dataRef.name} from parent ${
      e.dragNode.props.dataRef.parent.title.props.taxon.name
    } to parent ${e.node.props.dataRef.title.props.taxon.name}?`;
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

  handleDrop = e => {
    const { mode } = this.state;
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
      loadedKeys
    } = this.state;
    const { draggable, onDragStart } = this.props;
    return (
      <div>
        {" "}
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {treeData.length > 0 && (
          <Tree
            showLine={true}
            defaultExpandAll={defaultExpandAll}
            defaultExpandedKeys={defaultExpandedKeys}
            draggable={draggable}
            onDrop={this.handleDrop}
            onDragStart={onDragStart}
            loadedKeys={loadedKeys}
            loadData={this.onLoadData}
            onLoad={(loadedKeys, obj) => this.setState({loadedKeys})}
            onExpand={(expandedKeys, obj) => {
              if(!obj.expanded){
                // Remove children when a node is collapsed to improve performance on large trees
               delete obj.node.props.dataRef.children;
               obj.node.props.dataRef.childOffset = 0;
               this.setState({treeData: [...this.state.treeData], loadedKeys: this.state.loadedKeys.filter(k => k !== obj.node.props.dataRef.key )})
              }
            }}
          >
            {this.renderTreeNodes(treeData)}
          </Tree>
        )}
      </div>
    );
  }
}

export default ColTree;
