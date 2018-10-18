import React from 'react';
import { Tree, Row, Col, notification, message, Tag, Popconfirm, Icon, Input, Button, AutoComplete, Popover, Alert, Modal, Select } from 'antd'
import _ from 'lodash'
import Layout from '../../components/Layout'
import axios from 'axios';
import config from '../../config'
import debounce from 'lodash.debounce';
import EventEmitter from 'events';
import ErrorMsg from '../../components/ErrorMsg';

const TreeNode = Tree.TreeNode;
const Search = Input.Search;
const Option = AutoComplete.Option;

const MANAGEMENT_CLASSIFICATION_DATASET_KEY = 1000;

class ModeActions extends EventEmitter {

    mode = 'attach'
    changeMode = (mode) => {
        this.mode = mode;
        this.emit('modeChange', mode)
    }
    getMode = () => {
        return this.mode;
    }
    getListenerCount = () => {
        return this.listeners('modeChange').length
    }
}
const modeActions = new ModeActions;

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
            mode: modeActions.getMode()
        })
        modeActions.setMaxListeners(Math.max(modeActions.getListenerCount() + 1, 10));
        modeActions.on('modeChange', this.setMode)
    }
    componentWillUnmount = () => {
        modeActions.removeListener('modeChange', this.setMode);
        modeActions.setMaxListeners(Math.max(modeActions.getListenerCount() - 1, 10))
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
        const { taxon, datasetKey, isMapped, hasPopOver } = this.props;
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
                        {isMapped && <span> <Icon type="link"></Icon></span>}
                        {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
                    </Popconfirm>
                </Popover>}
                {(mode !== 'modify' || !hasPopOver) &&
                    <Popconfirm visible={this.props.confirmVisible} title={this.props.confirmTitle} onConfirm={this.props.onConfirm} onCancel={this.props.onCancel}>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.rank}: </span>
                        {!nameIsItalic && <span style={style}>{taxon.name}</span>}
                        {nameIsItalic && <span style={style}><em>{taxon.name}</em> {taxon.authorship}</span>}
                        {isMapped && <span> <Icon type="link"></Icon></span>}
                        {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
                    </Popconfirm>}

            </div>)

    }

}


class ManagementClassification extends React.Component {
    constructor(props) {
        super(props);
        this.renderTreeNodes = this.renderTreeNodes.bind(this);
        this.loadRoot = this.loadRoot.bind(this);
        this.onLoadData = this.onLoadData.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleModify = this.handleModify.bind(this);
        this.handleAttach = this.handleAttach.bind(this)
        this.getDatasets = debounce(this.getDatasets, 500);
        this.saveSector = this.saveSector.bind(this)
        this.renderTreeNodes = this.renderTreeNodes.bind(this);

        this.state = {
            rootLoading: true,
            mcRootLoading: true,
            treeData: [
            ],
            mcTreeData: [
            ],
            datasets: [],
            treeDataError: null,
            mcTreeDataError: null,
            mode: 'attach'
        }
    }

    componentWillMount() {
        this.loadRoot('mcTreeData')
        // this.loadRoot('treeData')
    }

    componentWillUnmount() {
        this.getDatasets.cancel();
    }

    getDatasets = (q) => {

        axios(`${config.dataApi}dataset?q=${q}&limit=30`)
            .then((res) => {
                this.setState({ datasets: res.data.result })
            })
            .catch((err) => {
                this.setState({ datasets: [] })
            })
    }
    getSectorInfo = (root, attachment) => {
        // get the ColSources for the dataset  
        const { datasetKey } = this.state;
        return axios.all([
            axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`),
            axios(`${config.dataApi}dataset/${datasetKey}/name/${attachment.props.dataRef.key}`),
            axios(`${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION_DATASET_KEY}/name/${root.props.dataRef.key}`),
        ])
            .then(axios.spread((colsources, attachmentName, rootName) => {
                console.log(colsources.data[0])
                console.log(attachmentName.data)
                console.log(rootName.data)
                attachmentName.data.name = attachmentName.data.scientificName;
                rootName.data.name = rootName.data.scientificName;
                if (colsources.data.length > 1) {
                    this.setState({ sectorModal: { options: colsources.data, root: rootName.data, attachment: attachmentName.data, title: 'Please select Col Source for sector' } })
                    return
                } else if (colsources.data.length === 0) {
                    this.setState({ sectorModal: { datasetKey: datasetKey, title: 'No Col Sources for dataset' } })
                    return
                } else {
                    return this.saveSector(colsources.data[0], rootName.data, attachmentName.data)
                }


            }))

            .catch((err) => {
                this.setState({ sectorMappingError: err })
                console.log(err)
            });

    }

    saveSector = (source, root, attachment) => {
        
        return axios.post(`${config.dataApi}sector`, { colSourceKey: source.key, root: root, attachment: attachment })
            .then((res) => {
                const msg = `${attachment.name} attached to ${root.name} using colSource ${source.title} (${source.alias})`;
                notification.open({
                    message: 'Sector created',
                    description: msg
                });
                this.setState({sectorModal: null})
            })
            .catch((err) => {
                this.setState({ sectorMappingError: err , sectorModal: null})
                console.log(err)
            });
    }
    loadRoot = (tree) => {
        let id = (tree === 'treeData') ? this.state.datasetKey : MANAGEMENT_CLASSIFICATION_DATASET_KEY;
        const that = this;
        axios(`${config.dataApi}dataset/${id}/tree`)
            .then((values) => {
                let mainTreeData = values.data;
                let treeData = _.map(mainTreeData, (tx) => {
                    return { title: <ColTreeNode taxon={tx} datasetKey={id} confirmVisible={false} hasPopOver={tree === 'mcTreeData'}></ColTreeNode>, key: tx.id, datasetKey: id, childCount: tx.childCount }
                })

                return treeData;
            })

            .then((treeData) => {
                let state = {};
                state[tree + 'Error'] = null;
                state[tree] = treeData;
                that.setState(state)


            })
            .catch((err) => {
                if (tree === 'treeData') {
                    this.setState({ treeData: [], treeDataError: err });
                } else if (tree === 'mcTreeData') {
                    this.setState({ mcTreeData: [], mcTreeDataError: err });
                }
            })
    }

    onLoadData = (treeNode, tree) => {
        let id = (tree === 'treeData') ? this.state.datasetKey : MANAGEMENT_CLASSIFICATION_DATASET_KEY;

        return axios(`${config.dataApi}dataset/${id}/tree/${treeNode.props.eventKey}/children`)
            .then((res) => {
                treeNode.props.dataRef.children = _.map(res.data, (tx) => {
                    return { title: <ColTreeNode confirmVisible={false} taxon={tx} datasetKey={id} isMapped={treeNode.props.title.props.isMapped} hasPopOver={tree === 'mcTreeData'}></ColTreeNode>, key: tx.id, datasetKey: id, childCount: tx.childCount, parent: treeNode.props.dataRef, name: tx.name }
                });
                let state = {};
                state[tree + 'Error'] = null;
                let treeData = this.state[tree];
                state[tree] = treeData;
                this.setState(state);
            })
            .catch((err) => {
                if (tree === 'treeData') {
                    this.setState({ treeData: [], treeDataError: err });
                } else if (tree === 'mcTreeData') {
                    this.setState({ mcTreeData: [], mcTreeDataError: err });
                }
                console.log(err)
            })

    }



    renderTreeNodes = (data) => {
        return data.map((item) => {
            if (item.children) {
                return (
                    <TreeNode onDragStart={(e) => { e.dataTransfer.setData('text', item.datasetkey) }} datasetKey={item.datasetKey} title={item.title} key={item.key} dataRef={item} isLeaf={item.childCount === 0} >
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode {...item} datasetKey={item.datasetKey} dataRef={item} isLeaf={item.childCount === 0} />;
        });
    }
    onSelectDataset = (val, obj) => {
        this.setState({ datasetKey: val, datasetName: obj.props.children, treeData: [] }, () => {
            this.loadRoot('treeData')
        })
    }

    confirmAttach = (node, dragNode) => {
        /*
       This is where sector mapping should be posted to the server
       */
        this.getSectorInfo(node, dragNode).then((res) => {
            console.log(res)

            node.props.dataRef.title = (<ColTreeNode
                taxon={node.props.title.props.taxon}
                datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
                isMapped={true}
                confirmVisible={false}
            ></ColTreeNode>)

            dragNode.props.dataRef.title = (<ColTreeNode
                taxon={dragNode.props.title.props.taxon}
                datasetKey={dragNode.props.title.props.datasetKey}
                isMapped={true}
            ></ColTreeNode>)

            // Saving is done immediatly after confirm, so the children should be updated     
            this.setState({ ...this.state.mcTreeData })
        })
    }

    handleAttach = (e) => {

        if (this.state.dragNode.props.datasetKey === e.node.props.datasetKey) {
            message.warn('You cant modify the management classification in attachment mode');
            return; // we are in modify mode and should not react to the event
        }
        if (this.state.dragNode.props.title.props.taxon.rank !== e.node.props.title.props.taxon.rank) {
            message.error('You can only map taxa of equal rank');
            return;
        }
        const msg = `Attach ${this.state.dragNode.props.title.props.taxon.name} from ${this.state.datasetName} to ${e.node.props.title.props.taxon.name} in MC classification?`;
        e.node.props.dataRef.title =
            (<ColTreeNode
                taxon={e.node.props.title.props.taxon}
                datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
                confirmVisible={true}
                confirmTitle={msg}
                onConfirm={() => {
                    this.confirmAttach(e.node, this.state.dragNode)
                }}
                onCancel={() => {
                    e.node.props.dataRef.title = <ColTreeNode
                        taxon={e.node.props.title.props.taxon}
                        datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
                        isMapped={e.node.props.title.props.isMapped}
                        confirmVisible={false}
                    ></ColTreeNode>;
                    this.setState({ ...this.state.mcTreeData });
                }}
            ></ColTreeNode>)
        console.log(this.state.dragNode.props.dataRef.title.props.taxon.name + " --> " + e.node.props.dataRef.title.props.taxon.name)
        this.setState({ ...this.state.mcTreeData })
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
            datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
            isMapped={e.node.props.title.props.isMapped}
            confirmVisible={false}
        ></ColTreeNode>)
        let msg = `You moved ${e.dragNode.props.dataRef.name} from parent ${e.dragNode.props.dataRef.parent.title.props.taxon.name} to parent ${e.node.props.dataRef.title.props.taxon.name}`;
        this.setState({
            mcTreeData: [...this.state.mcTreeData],
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
                datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
                confirmVisible={true}
                confirmTitle={msg}
                onConfirm={() => {
                    this.confirmModify(e)
                }}
                onCancel={() => {
                    e.node.props.dataRef.title = <ColTreeNode
                        taxon={e.node.props.title.props.taxon}
                        datasetKey={MANAGEMENT_CLASSIFICATION_DATASET_KEY}
                        isMapped={e.node.props.title.props.isMapped}
                        confirmVisible={false}
                    ></ColTreeNode>;
                    this.setState({ ...this.state.mcTreeData });
                }}
            ></ColTreeNode>)
        this.setState({ ...this.state.mcTreeData })
    }

    handleDrop = (e) => {
        const { mode } = this.state;
        if (mode === 'attach') {
            this.handleAttach(e)
        } else if (mode === 'modify') {
            this.handleModify(e)
        }
    }
    onDragStart = (e) => {
        this.setState({ dragNode: e.node })
    }


    toggleMode = (mode) => {
        this.setState({ mode: mode })
        modeActions.changeMode(mode)
    }
    cancelSectorModal = () => {
        this.setState({ sectorModal: null })
    }
    render() {

        const { treeDataError, mcTreeDataError } = this.state;

        return (
            <Layout selectedMenuItem="managementclassification">
                <Row>           <Alert style={{ marginBottom: '10px' }} message="This page is under development. Actions are not yet send to the backend. Some inconsistency may occur..." type="warning" /></Row>
                <Row><Col span={3}>
                    <Button type={this.state.mode === 'modify' ? 'primary' : ''} onClick={() => this.toggleMode('modify')} size="large" style={{ marginBottom: '20px' }}>Modify MC</Button>
                </Col>
                    <Col span={3}>
                        <Button type={this.state.mode === 'attach' ? 'primary' : ''} onClick={() => this.toggleMode('attach')} size="large" style={{ marginBottom: '20px' }}>Attach sectors</Button>
                    </Col>
                    <Col span={18}>
                    </Col>

                </Row>
                <Row>
                    <Col span={6}>
                        <h4>Management Classification</h4>
                    </Col><Col span={6}>
                        <Search
                            placeholder="Find taxon (not yet functional)"
                            onSearch={value => console.log(value)}
                            style={{ width: 200 }}
                        />
                    </Col><Col span={6}>
                        <AutoComplete
                            dataSource={this.state.datasets}
                            style={{ width: 200 }}
                            onSelect={this.onSelectDataset}
                            onSearch={this.getDatasets}
                            placeholder="Find dataset"
                        >
                            {this.state.datasets && this.state.datasets.map((o) => {
                                return <Option key={o.key}>{o.title}</Option>
                            })}
                        </AutoComplete>
                    </Col><Col span={6}>
                        <Search
                            placeholder="Find taxon (not yet functional)"
                            onSearch={value => console.log(value)}
                            style={{ width: 200 }}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} style={{ overflowY: 'scroll', height: '800px' }}>
                        {mcTreeDataError && <Alert message={<ErrorMsg error={mcTreeDataError}></ErrorMsg>} type="error" />}

                        <Tree showLine={true} defaultExpandAll={true} draggable={true} onDrop={this.handleDrop} onDragStart={this.onDragStart} loadData={(node) => this.onLoadData(node, 'mcTreeData')}>
                            {this.renderTreeNodes(this.state.mcTreeData)}
                        </Tree>
                    </Col>

                    <Col span={12} style={{ overflowY: 'scroll', height: '800px' }}>
                        {!this.state.datasetKey && <h3>No dataset selected</h3>}
                        {treeDataError && <Alert message={<ErrorMsg error={treeDataError}></ErrorMsg>} type="error" />}

                        {this.state.treeData.length > 0 && <Tree showLine={true} defaultExpandAll={true} draggable={this.state.mode === 'attach'} onDragStart={this.onDragStart} loadData={(node) => this.onLoadData(node, 'treeData')}>
                            {this.renderTreeNodes(this.state.treeData)}
                        </Tree>}
                    </Col>
                </Row>

                <Modal
                    title={_.get(this.state, 'sectorModal.title')}
                    visible={!_.isUndefined(this.state.sectorModal) && this.state.sectorModal !== null}
                    onCancel={this.cancelSectorModal}
                >
                    {_.get(this.state, 'sectorModal.options') &&
                        <Select style={{ width: 240 }} 
                            onChange={(value) => this.saveSector(_.find(_.get(this.state, 'sectorModal.options'), (o)=>{ return o.key === value}), _.get(this.state, 'sectorModal.root'), _.get(this.state, 'sectorModal.attachment')) }>
                            {this.state.sectorModal.options.map((o) => {
                                return <Option key={o.key} value={o.key}>{o.alias} - {o.title}</Option>
                            })}
                        </Select>}
                </Modal>

            </Layout>
        );
    }
}



export default ManagementClassification;