import React from "react";
import { Tree, Spin, Tag, Alert, Select, Popover, Row, Col, Button } from "antd";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";
import history from "../../../history";
import ErrorMsg from "../../../components/ErrorMsg";
import ChildLessRootsTable from './ChildLessRootsTable'
import PageContent from '../../../components/PageContent'

const CHILD_PAGE_SIZE = 500 // How many children will we load at a time


const TreeNode = Tree.TreeNode;


class ColTreeNode extends React.Component {
  constructor(props) {
    super(props); 
  }

  render = () => {
    const { taxon, datasetKey } = this.props;
    return (
      <Popover
      content={
        <Row>
          <Col span={12}>
            
            <Button style={{ marginLeft: "12px" }} type="primary" onClick={()=>{
              const win = window.open(`/dataset/${datasetKey}/taxon/${taxon.id}`, '_blank');
              win.focus();
              
            }}>
              Open in new tab
            </Button>
          </Col>
        </Row>
      }
      title="Options"
      trigger="hover"
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
        <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>
        
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


class TreeExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rootLoading: true,
      treeData: [],
      loadedKeys: []
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
        const mainTreeData = values[0].data.result;
        const defaultExpanded = values[1] ? values[1].data : null;
        const treeData = mainTreeData.map( tx => {
          return {
            title: <ColTreeNode taxon={tx} datasetKey={id} popOverVisible={false}/>,
            key: tx.id,
            childCount: tx.childCount,
            childOffset: 0,
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
              childOffset: 0,
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

  expandSingleChildNodes = (treeData) => {

    let currentNode = treeData;

    while(currentNode.length === 1 && currentNode.childCount === 1){
      
    }

  }

  fetchChildPage = (treeNode, datasetKey, taxonKey, offset, limit) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/tree/${encodeURIComponent(taxonKey)}/children?limit=${limit}&offset=${offset}`
    ).then(res => res.data.result.map( tx => 
       ({
        title: <ColTreeNode taxon={tx} datasetKey={datasetKey} popOverVisible={false}/>,
        key: tx.id,
        childCount: tx.childCount,
        childOffset: 0,
        parent: treeNode.props.dataRef,
        taxon: tx
      })
    ))
  }
  onLoadData = treeNode => {

    const { id } = this.props;
    const childcount = _.get(treeNode, 'props.dataRef.childCount')
    const offset = _.get(treeNode, 'props.dataRef.childOffset');
    return this.fetchChildPage(treeNode, id, treeNode.props.eventKey, offset, CHILD_PAGE_SIZE)
            .then(data => {
              treeNode.props.dataRef.children = treeNode.props.dataRef.children ? [...treeNode.props.dataRef.children, ...data] : data;

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

  onRightClick = ({event, node}) => {
    node.props.dataRef.title = <ColTreeNode taxon={node.props.dataRef.title.props.taxon} datasetKey={node.props.dataRef.title.props.datasetKey} popOverVisible={true}/>
    this.setState({ ...this.state.treeData });
  }
  render() {
    const {
      rootLoading,
      defaultExpandAll,
      defaultExpandedKeys,
      loadedKeys,
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
              loadedKeys={loadedKeys}
              onRightClick={this.onRightClick}
              onExpand={(expandedKeys, obj) => {
                if(!obj.expanded){
                  // Remove children when a node is collapsed to improve performance on large trees
                 delete obj.node.props.dataRef.children;
                 obj.node.props.dataRef.childOffset = 0;
                 this.setState({treeData: [...this.state.treeData], loadedKeys: this.state.loadedKeys.filter(k => k !== obj.node.props.dataRef.key )})
                }
              }}
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
