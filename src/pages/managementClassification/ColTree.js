
import React from 'react';
import { Tree, Row, Col, notification, message, Tag, Popconfirm, Icon, Button, Popover, Alert } from 'antd'
import _ from 'lodash'
import axios from 'axios';
import config from '../../config'
import colTreeActions from './ColTreeActions';
import ErrorMsg from '../../components/ErrorMsg';
const TreeNode = Tree.TreeNode;

class ColTreeNode extends React.Component {

    constructor(props) {
        super(props);
        this.setMode = this.setMode.bind(this)
        this.state = {
            style: {},
            popOverVisible: false
        }
    }
    setMode = (mode) => {
        this.setState({ mode })
    }
    componentDidMount = () => {
        this.setState({
            mode: colTreeActions.getMode()
        })
        colTreeActions.setMaxListeners(Math.max(colTreeActions.getListenerCount('modeChange') + 1, 10));
        colTreeActions.on('modeChange', this.setMode)
    }
    componentWillUnmount = () => {
        colTreeActions.removeListener('modeChange', this.setMode);
        colTreeActions.setMaxListeners(Math.max(colTreeActions.getListenerCount('modeChange') - 1, 10))
    }

    hidePopover = () => {
        this.setState({
            popOverVisible: false,
        });
    }
    handleVisibleChange = (popOverVisible) => {
        this.setState({ popOverVisible });
    }

    render = () => {
        const { taxon, isMapped, hasPopOver, isUpdating } = this.props;
        const { mode } = this.state;
        const nameIsItalic = taxon.rank === "species" || taxon.rank === "genus"
        const style = (this.props.isMapped) ? { color: 'green' } : {};
        return (

            <div>
                {mode === 'modify' && hasPopOver && <Popover
                    content={<Row><Col span={12}><Button type="danger">Delete taxon</Button></Col><Col span={12}> <Button style={{ marginLeft: '12px' }} type="primary">Add child</Button></Col></Row>}
                    title="Options"
                    visible={this.state.popOverVisible}
                    onVisibleChange={this.handleVisibleChange}
                    trigger="click"
                    placement="rightTop"

                >
                    <Popconfirm visible={this.props.confirmVisible} title={this.props.confirmTitle} onConfirm={this.props.onConfirm} onCancel={this.props.onCancel}>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.rank}: </span>
                        {!nameIsItalic && <span style={style}>{taxon.name}</span>}
                        {nameIsItalic && <span style={style}><em>{taxon.name}</em> {taxon.authorship}</span>}
                        {mode === 'modify' && !_.isUndefined(taxon.speciesCount) && <span> • {taxon.speciesCount} {!_.isUndefined(taxon.speciesEstimate) && <span> of {taxon.speciesEstimate} est. </span>}living species</span>}
                        {isMapped && <span> <Icon type="link"></Icon></span>}
                        {isUpdating && <span> <Icon type="sync" spin /></span>}
                        {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
                    </Popconfirm>
                </Popover>}
                {(mode !== 'modify' || !hasPopOver) &&
                    <Popconfirm visible={this.props.confirmVisible} title={this.props.confirmTitle} onConfirm={this.props.onConfirm} onCancel={this.props.onCancel}>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.rank}: </span>
                        {!nameIsItalic && <span style={style}>{taxon.name}</span>}
                        {nameIsItalic && <span style={style}><em>{taxon.name}</em> {taxon.authorship}</span>}
                        {mode === 'modify' && !_.isUndefined(taxon.speciesCount) && <span> • {taxon.speciesCount} {!_.isUndefined(taxon.speciesEstimate) && <span> of {taxon.speciesEstimate} est. </span>}living species</span>}
                        {isMapped && <span> <Icon type="link"></Icon></span>}
                        {isUpdating && <span> <Icon type="sync" spin /></span>}
                        {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
                    </Popconfirm>}

            </div>)

    }

}

class ColTree extends React.Component {
    constructor(props) {
        super(props);
        this.loadRoot = this.loadRoot.bind(this);
        this.onLoadData = this.onLoadData.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleModify = this.handleModify.bind(this);
        this.handleAttach = this.handleAttach.bind(this)
        this.renderTreeNodes = this.renderTreeNodes.bind(this);

        this.state = {
            rootLoading: true,
            treeData: [
            ],
            error: null,
            mode: 'attach'
        }
    }

    componentWillMount() {
        this.loadRoot()
        if (this.props.treeType === 'gsd') {
            colTreeActions.on('attachmentSuccess',
                (dragNode) => {
                    if (dragNode.dataset === this.props.dataset) {
                        dragNode.props.dataRef.title = (<ColTreeNode
                            taxon={dragNode.props.title.props.taxon}
                            datasetKey={dragNode.props.title.props.datasetKey}
                            isMapped={true}
                        ></ColTreeNode>)
                        this.setState({ ...this.state.treeData })
                    }
                })

        }
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.dataset.key !== this.props.dataset.key) {
            this.setState({ treeData: [] }, this.loadRoot);
        }
    }

    loadRoot = () => {
        const { dataset: { key } } = this.props;
        let id = key;
        axios(`${config.dataApi}dataset/${id}/tree`)
            .then((values) => {
                let mainTreeData = values.data;
                let treeData = _.map(mainTreeData, (tx) => {
                    return { title: <ColTreeNode taxon={tx} datasetKey={id} confirmVisible={false} hasPopOver={this.props.treeType === 'mc'}></ColTreeNode>, key: tx.id, datasetKey: id, childCount: tx.childCount }
                })

                this.setState({ treeData: treeData, error: null })
            })
            .catch((err) => {
                this.setState({ treeData: [], error: err });

            })
    }

    onLoadData = (treeNode) => {
        const { dataset: { key } } = this.props;
        let id = key;

        return axios(`${config.dataApi}dataset/${id}/tree/${treeNode.props.eventKey}/children`)
            .then((res) => {
                treeNode.props.dataRef.children = _.map(res.data, (tx) => {
                    return { title: <ColTreeNode confirmVisible={false} taxon={tx} datasetKey={id} isMapped={treeNode.props.title.props.isMapped} hasPopOver={this.props.treeType === 'mc'}></ColTreeNode>, key: tx.id, datasetKey: id, childCount: tx.childCount, parent: treeNode.props.dataRef, name: tx.name }
                });
                const { treeData } = this.state;
                this.setState({ treeData: treeData, error: null })
            })
            .catch((err) => {
                this.setState({ treeData: [], error: err });
                console.log(err)
            })

    }

    confirmAttach = (node, dragNode) => {
        /*
       This is where sector mapping should be posted to the server
       */
      node.props.dataRef.title = (<ColTreeNode
        taxon={node.props.title.props.taxon}
        datasetKey={this.props.dataset.key}
        isUpdating={true}
        confirmVisible={false}
    ></ColTreeNode>)
    this.setState({ ...this.state.treeData });
        this.props.attachFn(node, dragNode).then((res) => {

            node.props.dataRef.title = (<ColTreeNode
                taxon={node.props.title.props.taxon}
                datasetKey={this.props.dataset.key}
                isMapped={true}
                isUpdating={false}
                confirmVisible={false}
            ></ColTreeNode>)


            colTreeActions.attachmentSuccess(dragNode);

            // Saving is done immediatly after confirm, so the children should be updated     
            this.setState({ ...this.state.treeData })
        })
    }

    handleAttach = (e) => {

        if (this.props.dragNode.props.datasetKey === e.node.props.datasetKey) {
            message.warn('You cant modify the management classification in attachment mode');
            return; // we are in modify mode and should not react to the event
        }
        if (this.props.dragNode.props.title.props.taxon.rank !== e.node.props.title.props.taxon.rank) {
            message.error('You can only map taxa of equal rank');
            return;
        }
        const msg = `Attach ${this.props.dragNode.props.title.props.taxon.name} from ${this.props.dragNode.dataset.title} to ${e.node.props.title.props.taxon.name} in ${this.props.dataset.title}?`;
        e.node.props.dataRef.title =
            (<ColTreeNode
                taxon={e.node.props.title.props.taxon}
                datasetKey={this.props.dataset.key}
                confirmVisible={true}
                confirmTitle={msg}
                onConfirm={() => {
                    this.confirmAttach(e.node, this.props.dragNode)
                }}
                onCancel={() => {
                    e.node.props.dataRef.title = <ColTreeNode
                        taxon={e.node.props.title.props.taxon}
                        datasetKey={this.props.dataset.key}
                        isMapped={e.node.props.title.props.isMapped}
                        confirmVisible={false}
                    ></ColTreeNode>;
                    this.setState({ ...this.state.treeData });
                }}
            ></ColTreeNode>)
        console.log(this.props.dragNode.props.dataRef.title.props.taxon.name + " --> " + e.node.props.dataRef.title.props.taxon.name)
        this.setState({ ...this.state.treeData })
    }
    confirmModify = (e) => {
        if (e.node.props.dataRef.children) {
            e.node.props.dataRef.children.push(e.dragNode.props.dataRef)
        } else {
            e.node.props.dataRef.children = [e.dragNode.props.dataRef]
        }
        _.remove(e.dragNode.props.dataRef.parent.children, function (n) {
            return n.key === e.dragNode.props.dataRef.key;
        });
        e.node.props.dataRef.title = (<ColTreeNode
            taxon={e.node.props.title.props.taxon}
            datasetKey={this.props.dataset.key}
            isMapped={e.node.props.title.props.isMapped}
            confirmVisible={false}
        ></ColTreeNode>)
        let msg = `You moved ${e.dragNode.props.dataRef.name} from parent ${e.dragNode.props.dataRef.parent.title.props.taxon.name} to parent ${e.node.props.dataRef.title.props.taxon.name}`;
        this.setState({
            treeData: [...this.state.treeData],
            defaultExpandAll: false
        }, () => {
            notification.open({
                message: 'Taxon moved',
                description: msg
            });

        });
    }
    handleModify = (e) => {
        const msg = `Move ${e.dragNode.props.dataRef.name} from parent ${e.dragNode.props.dataRef.parent.title.props.taxon.name} to parent ${e.node.props.dataRef.title.props.taxon.name}?`;
        e.node.props.dataRef.title =
            (<ColTreeNode
                taxon={e.node.props.title.props.taxon}
                datasetKey={this.props.dataset.key}
                confirmVisible={true}
                confirmTitle={msg}
                onConfirm={() => {
                    this.confirmModify(e)
                }}
                onCancel={() => {
                    e.node.props.dataRef.title = <ColTreeNode
                        taxon={e.node.props.title.props.taxon}
                        datasetKey={this.props.dataset.key}
                        isMapped={e.node.props.title.props.isMapped}
                        confirmVisible={false}
                    ></ColTreeNode>;
                    this.setState({ ...this.state.treeData });
                }}
            ></ColTreeNode>)
        this.setState({ ...this.state.treeData })
    }

    handleDrop = (e) => {
        const { mode } = this.state;
        const { treeType } = this.props;
        if (treeType !== 'mc') {
            return;
        }
        if (mode === 'attach') {
            this.handleAttach(e)
        } else if (mode === 'modify') {
            this.handleModify(e)
        }
    }

    renderTreeNodes = (data) => {
        return data.map((item) => {
            if (item.children) {
                return (
                    <TreeNode datasetKey={item.datasetKey} title={item.title} key={item.key} dataRef={item} isLeaf={item.childCount === 0} >
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode {...item} datasetKey={item.datasetKey} dataRef={item} isLeaf={item.childCount === 0} />;
        });
    }

    render() {

        const { error, treeData } = this.state;
        const { draggable, onDragStart, treeType } = this.props;
        return (

            <div>  {error && <Alert message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}

                {treeData.length > 0 && <Tree showLine={true} defaultExpandAll={treeType !== 'mc'} draggable={draggable} onDrop={this.handleDrop} onDragStart={onDragStart} loadData={this.onLoadData}>
                    {this.renderTreeNodes(treeData)}
                </Tree>}
            </div>

        );
    }

}

export default ColTree