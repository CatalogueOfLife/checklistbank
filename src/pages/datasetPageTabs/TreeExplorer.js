
import React from 'react';
import { Tree, Popover, Spin, Tag } from 'antd';
import axios from 'axios'
import config from '../../config';
import _ from 'lodash';

const TreeNode = Tree.TreeNode;
const CHILD_LOAD_LIMIT = 100;

class ColTreeNode extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            childOffset: this.props.childOffset || 0
        }
    }

    render = () => {
        const { taxon } = this.props;
        const nameIsItalic = taxon.name.rank === "species" || taxon.name.rank === "genus"
        return (
            <Popover placement="rightTop" title={taxon.name.scientificName} trigger="click">
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.name.rank}: </span>
                {!nameIsItalic && <span>{taxon.name.scientificName}</span>}
                {nameIsItalic && <span><em>{taxon.name.scientificName}</em> {taxon.name.authorship}</span>}
                {!taxon.name.available && <Tag color="red">Not available</Tag>}
            </Popover>)
    }

}

class LoadMoreChildrenTreeNode extends React.Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
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
        const { id } = this.props;
        const that = this;
        axios(`${config.dataApi}dataset/${id}/taxon?root=true`)
            .then((res) => {
                let treeData = _.map(res.data.result, (tx) => {
                    return { title: <ColTreeNode taxon={tx}></ColTreeNode>, key: tx.id, childOffset: 0 , childCount: tx.childCount}
                })
                that.setState({ treeData , rootLoading: false})
            })
    }

    onLoadData = (treeNode) => {
        console.log(treeNode)
        let that = this;
        const { id } = this.props;
        return axios(`${config.dataApi}dataset/${id}/taxon/${treeNode.props.eventKey}/children?limit=${CHILD_LOAD_LIMIT}&offset=${treeNode.props.dataRef.childOffset}`)
            .then((res) => {
                if (!treeNode.props.dataRef.children) {
                    treeNode.props.dataRef.children = [];
                }
                treeNode.props.dataRef.children = treeNode.props.dataRef.children.concat(_.map(res.data.result, (tx) => {
                    return { title: <ColTreeNode taxon={tx}></ColTreeNode>, key: tx.id, childOffset: treeNode.props.dataRef.childOffset, childCount: tx.childCount }
                }))
                if (res.data.last !== true) {
                    const loadMoreFn = () => {
                        treeNode.props.dataRef.childOffset += CHILD_LOAD_LIMIT;
                        if (treeNode.props.dataRef.children[treeNode.props.dataRef.children.length - 1].type === '__loadMoreBTN__') {
                            treeNode.props.dataRef.children.pop();
                        }
                        that.onLoadData(treeNode)
                    }
                    treeNode.props.dataRef.children.push({ title: <LoadMoreChildrenTreeNode onClick={loadMoreFn} key="__loadMoreBTN__"></LoadMoreChildrenTreeNode>, type: '__loadMoreBTN__' })
                }
                this.setState({
                    treeData: [...this.state.treeData],
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
            return <TreeNode {...item} dataRef={item} isLeaf={item.childCount === 0}/>;
        });
    }

    render() {
        const {rootLoading} = this.state;
        return (
            <div>
                {rootLoading && <Spin />}
           { !rootLoading && <Tree loadData={this.onLoadData} showLine={true}>
                {this.renderTreeNodes(this.state.treeData)}
            </Tree>}
            </div>

        );
    }
}

export default TreeExplorer