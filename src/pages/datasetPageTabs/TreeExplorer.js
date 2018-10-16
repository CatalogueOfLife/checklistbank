
import React from 'react';
import { Tree, Popover, Spin, Tag, Alert, Switch, notification } from 'antd';
import axios from 'axios'
import config from '../../config';
import _ from 'lodash';
import history from '../../history';
import ErrorMsg from '../../components/ErrorMsg';

const TreeNode = Tree.TreeNode;

class ColTreeNode extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            childOffset: this.props.childOffset || 0
        }
    }

    render = () => {
        const { taxon, datasetKey } = this.props;
        const nameIsItalic = taxon.rank === "species" || taxon.rank === "genus"
        return (
            <div onClick={() => {
                history.push(`/dataset/${datasetKey}/classification?taxonKey=${taxon.id}`)
                history.push(`/dataset/${datasetKey}/taxon/${taxon.id}`)
            }
            }>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.rank}: </span>
                {!nameIsItalic && <span>{taxon.name}</span>}
                {nameIsItalic && <span><em>{taxon.name}</em> {taxon.authorship}</span>}
                {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
            </div>)
        
    }

}


class TreeExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.loadRoot = this.loadRoot.bind(this);
        this.onLoadData = this.onLoadData.bind(this);
        this.renderTreeNodes = this.renderTreeNodes.bind(this);
        this.state = {
            rootLoading: true,
            treeData: [
            ],
        }
    }

    componentWillMount() {
        this.loadRoot()
    }

    loadRoot = () => {
        const { id, defaultExpandKey } = this.props;
        const that = this;
        var defaultExpandedNodes;
        let p = (defaultExpandKey) ? axios(`${config.dataApi}dataset/${id}/tree/${defaultExpandKey}`) : Promise.resolve(false);

        Promise.all([axios(`${config.dataApi}dataset/${id}/tree`), p])
            .then((values) => {
                let mainTreeData = values[0].data;
                let defaultExpanded = (values[1]) ? values[1].data : null;
                let treeData = _.map(mainTreeData, (tx) => {
                    return { title: <ColTreeNode taxon={tx} datasetKey={id}></ColTreeNode>, key: tx.id, childOffset: 0, childCount: tx.childCount }
                })
                if (defaultExpanded) {
                    defaultExpandedNodes = [];
                    let root = _.find(treeData, ['key', defaultExpanded[defaultExpanded.length - 1].id]);
                    for (let i = defaultExpanded.length - 2; i > -1; i--) {
                        let tx = defaultExpanded[i];
                        if(i > 0){
                            defaultExpandedNodes.push(tx.id)
                        }
                        let node = { title: <ColTreeNode taxon={tx} datasetKey={id}></ColTreeNode>, key: tx.id, childOffset: 0, childCount: tx.childCount };
                        root.children = [node];
                        root = node;
                    }

                }
                return treeData;
            })

            .then((treeData) => {
                if (defaultExpandedNodes && defaultExpandKey) {
                    that.setState({ treeData, rootLoading: false, defaultExpandAll: false, defaultExpandedKeys: defaultExpandedNodes })
                } else {
                    that.setState({ treeData, rootLoading: false, defaultExpandAll: treeData.length < 10 })
                }

            })
            .catch((err) => {
                that.setState({ error: err })
            })
    }

    onLoadData = (treeNode) => {
        const { id } = this.props;
        return axios(`${config.dataApi}dataset/${id}/tree/${treeNode.props.eventKey}/children`)
            .then((res) => {                
                treeNode.props.dataRef.children = _.map(res.data, (tx) => {
                    return { title: <ColTreeNode taxon={tx} datasetKey={id}></ColTreeNode>, key: tx.id, childOffset: treeNode.props.dataRef.childOffset, childCount: tx.childCount, parent: treeNode.props.dataRef, name: tx.name }
                });

                this.setState({
                    treeData: [...this.state.treeData],
                    defaultExpandAll: false
                });
            })

    }

    renderTreeNodes = (data) => {
        return data.map((item) => {
            if (item.children) {
                return (
                    <TreeNode title={item.title} key={item.key} dataRef={item} isLeaf={item.childCount === 0}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode {...item} dataRef={item} isLeaf={item.childCount === 0} />;
        });
    }

    render() {
        const { rootLoading, defaultExpandAll, defaultExpandedKeys, error } = this.state;
        const { defaultExpandKey } = this.props;
        const defaultSelectedKeys = (defaultExpandKey) ? [defaultExpandKey] : null
        return (
            <div>

                {error && <Alert message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}

                {!error && rootLoading && <Spin />}
                {!error && !rootLoading && <Tree  loadData={this.onLoadData} showLine={true} defaultExpandAll={defaultExpandAll} defaultExpandedKeys={defaultExpandedKeys} defaultSelectedKeys={defaultSelectedKeys}>
                    {this.renderTreeNodes(this.state.treeData)}
                </Tree>}
            </div>

        );
    }
}

export default TreeExplorer