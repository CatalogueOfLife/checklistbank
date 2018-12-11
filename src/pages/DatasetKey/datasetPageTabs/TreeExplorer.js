import React from "react";
import { Tree, Spin, Tag, Alert, AutoComplete, Select, Popover, Row, Col, Button } from "antd";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";
import history from "../../../history";
import ErrorMsg from "../../../components/ErrorMsg";
import ChildLessRootsTable from './ChildLessRootsTable'
import PageContent from '../../../components/PageContent'

const TreeNode = Tree.TreeNode;
//const Option = AutoComplete.Option;
const Option = Select.Option;
class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      childOffset: this.props.childOffset || 0
    };
  }

  render = () => {
    const { taxon, datasetKey } = this.props;
    const nameIsItalic = taxon.rank === "species" || taxon.rank === "genus";
    return (
      <Popover
      content={
        <Row>
          <Col span={12}>
            {" "}
            <Button style={{ marginLeft: "12px" }} type="primary">
              Open on new tab
            </Button>
          </Col>
        </Row>
      }
      title="Options"
      visible={this.state.popOverVisible}
      onVisibleChange={this.handleVisibleChange}
      placement="rightTop"
    >
      <div
        onClick={() => {
          history.push(
            `/dataset/${datasetKey}/classification?taxonKey=${taxon.id}`
          );
          history.push(`/dataset/${datasetKey}/taxon/${taxon.id}`);
        }}
      >
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{taxon.rank}: </span>
        {!nameIsItalic && <span>{taxon.name}</span>}
        {nameIsItalic && (
          <span>
            <em>{taxon.name}</em> {taxon.authorship}
          </span>
        )}
        {taxon.status !== "accepted" && (
          <Tag color="red" style={{ marginLeft: "6px" }}>
            {taxon.status}
          </Tag>
        )}
      </div>
      </Popover>
    );
  };
}

class TreeExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.loadRoot = this.loadRoot.bind(this);
    this.onLoadData = this.onLoadData.bind(this);
    this.renderTreeNodes = this.renderTreeNodes.bind(this);
    this.handleRootChange = this.handleRootChange.bind(this)
    this.state = {
      rootLoading: true,
      treeData: []
    };
  }

  componentWillMount() {
    this.loadRoot();
  }

  loadRoot = () => {
    const { id, defaultExpandKey } = this.props;
    var defaultExpandedNodes;
    let p = defaultExpandKey
      ? axios(`${config.dataApi}dataset/${id}/tree/${defaultExpandKey}`)
      : Promise.resolve(false);

    Promise.all([axios(`${config.dataApi}dataset/${id}/tree`), p])
      .then(values => {
        const mainTreeData = values[0].data;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map( tx => {
          return {
            title: <ColTreeNode taxon={tx} datasetKey={id} popOverVisible={false}/>,
            key: tx.id,
            childOffset: 0,
            childCount: tx.childCount,
            taxon: tx
          };
        });
        if (defaultExpanded) {
          defaultExpandedNodes = [];
          let root = _.find(treeData, [
            "key",
            defaultExpanded[defaultExpanded.length - 1].id
          ]);
          for (let i = defaultExpanded.length - 2; i > -1; i--) {
            let tx = defaultExpanded[i];
            if (i > 0) {
              defaultExpandedNodes.push(tx.id);
            }
            let node = {
              title: <ColTreeNode taxon={tx} datasetKey={id} popOverVisible={false}/>,
              key: tx.id,
              childCount: tx.childCount,
              taxon: tx

            };
            root.children = [node];
            root = node;
          }
        }
        return treeData;
      })

      .then(treeData => {
        if (defaultExpandedNodes && defaultExpandKey) {
          this.setState({
            treeData: treeData.filter(r => r.childCount > 0),
            childlessRoots: treeData.filter(r => r.childCount === 0).map(t => t.taxon),
            rootLoading: false,
            defaultExpandAll: false,
            defaultExpandedKeys: defaultExpandedNodes
          });
        } else {

            this.setState({
              treeData: treeData.filter(r => r.childCount > 0),
              childlessRoots: treeData.filter(r => r.childCount === 0).map(t => t.taxon),
              rootLoading: false,
              defaultExpandAll: treeData.length < 10
            });
          
        }
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  onLoadData = treeNode => {
    const { id } = this.props;
    console.log(encodeURIComponent(treeNode.props.eventKey))
    return axios(
      `${config.dataApi}dataset/${id}/tree/${encodeURIComponent(treeNode.props.eventKey)}/children`
    ).then(res => {
      treeNode.props.dataRef.children = res.data.map( tx => {
        return {
          title: <ColTreeNode taxon={tx} datasetKey={id} />,
          key: tx.id,
          childCount: tx.childCount,
          parent: treeNode.props.dataRef,
          taxon: tx
        };
      });

      this.setState({
        treeData: [...this.state.treeData],
        defaultExpandAll: false
      });
    });
  };

  renderTreeNodes = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <TreeNode
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
        <TreeNode {...item} dataRef={item} isLeaf={item.childCount === 0} />
      );
    });
  };
  handleRootChange = (value, children) => {
    this.setState({treeData: children.map((c)=> { return c.props.taxon})})
  }
  render() {
    const {
      rootLoading,
      defaultExpandAll,
      defaultExpandedKeys,
      childlessRoots,
      error
    } = this.state;
    const { defaultExpandKey, id } = this.props;

    const defaultSelectedKeys = defaultExpandKey ? [defaultExpandKey] : null;
    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {childlessRoots && childlessRoots.length > 0 && <Alert style={{marginBottom: '10px'}} message={`There are ${childlessRoots.length} root taxa with no children in this dataset. They are listed below the tree`} type="warning" />}
      

        {!error && rootLoading && <Spin />}
        {!error &&
          !rootLoading && (
            <Tree
              loadData={this.onLoadData}
              showLine={true}
              defaultExpandAll={defaultExpandAll}
              defaultExpandedKeys={defaultExpandedKeys}
              defaultSelectedKeys={defaultSelectedKeys}
            >
              {this.renderTreeNodes(this.state.treeData)}
            </Tree>
          )}

          {childlessRoots && childlessRoots.length > 0 && <ChildLessRootsTable datasetKey={id} data={childlessRoots}></ChildLessRootsTable>}
      </PageContent>
    );
  }
}

export default TreeExplorer;
