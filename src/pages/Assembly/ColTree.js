import React from "react";
import { Tree, notification, message, Alert } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import colTreeActions from "./ColTreeActions";
import ColTreeNode from "./ColTreeNode";
import ErrorMsg from "../../components/ErrorMsg";
const TreeNode = Tree.TreeNode;

class ColTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rootLoading: true,
      treeData: [],
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
          this.setState({ ...this.state.treeData });
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
    Promise.all([axios(`${config.dataApi}dataset/${id}/tree`), p])
      .then(values => {
        const mainTreeData = values[0].data;
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
                reloadSelfAndSiblings={() => {
                  this.loadRoot()
                }}
              />
            ),
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount
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
              taxon: tx
            };
            root.children = [node];
            root = node;
          }
        }
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            treeData: (treeType === "mc") ? treeData : treeData.filter(r => r.childCount > 0),
            defaultExpandAll:
              !defaultExpanded && treeType !== "mc" && treeData.length < 10,
            error: null,
            defaultExpandedKeys: defaultExpandedNodes
          });
        } else {
          this.setState({
            treeData: (treeType === "mc") ? treeData : treeData.filter(r => r.childCount > 0),
            defaultExpandAll: treeType !== "mc" && treeData.length < 10,
            error: null
          });
        }
      })
      .catch(err => {
        this.setState({ treeData: [], defaultExpandedKeys: null, error: err });
      });
  };

  onLoadData = treeNode => {
    const {
      dataset: { key },
      showSourceTaxon
    } = this.props;
    let id = key;

    return axios(
      `${config.dataApi}dataset/${id}/tree/${encodeURIComponent(
        treeNode.props.eventKey
      )}/children`
    )
      .then(res => {
        treeNode.props.dataRef.children = res.data.map( tx => {
          return {
            title: (
              <ColTreeNode
                confirmVisible={false}
                taxon={tx}
                datasetKey={id}
                hasPopOver={this.props.treeType === "mc"}
                reloadSelfAndSiblings={() => {
                  this.onLoadData(treeNode);
                }}
                showSourceTaxon={showSourceTaxon}
              />
            ),
            key: tx.id,
            datasetKey: id,
            childCount: tx.childCount,
            parent: treeNode.props.dataRef,
            name: tx.name
          };
        });
        const { treeData } = this.state;
        this.setState({ treeData: treeData, error: null });
      })
      .catch(err => {
        this.setState({ treeData: [], error: err });
        console.log(err);
      });
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
    this.setState({ ...this.state.treeData });
    this.props.attachFn(node, dragNode, mode).then(res => {
      node.props.dataRef.title.props.reloadSelfAndSiblings();

      this.setState({ ...this.state.treeData });
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
    const msg = (mode === 'ATTACH') ? `Attach ${
      this.props.dragNode.props.title.props.taxon.name
    } from ${this.props.dragNode.dataset.title} under ${
      e.node.props.title.props.taxon.name
    } in ${this.props.dataset.title}?` : 
    `Ranks are equal, this will merge children of ${this.props.dragNode.props.title.props.taxon.name} in ${this.props.dragNode.dataset.title} into children if ${e.node.props.title.props.taxon.name} in ${this.props.dataset.title}`


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
          this.setState({ ...this.state.treeData });
        }}
      />
    );
    console.log(
      this.props.dragNode.props.dataRef.title.props.taxon.name +
        " --> " +
        e.node.props.dataRef.title.props.taxon.name
    );
    this.setState({ ...this.state.treeData });
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
          this.setState({ ...this.state.treeData });
        }}
      />
    );
    this.setState({ ...this.state.treeData });
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
      defaultExpandedKeys
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
            loadData={this.onLoadData}
          >
            {this.renderTreeNodes(treeData)}
          </Tree>
        )}
      </div>
    );
  }
}

export default ColTree;
