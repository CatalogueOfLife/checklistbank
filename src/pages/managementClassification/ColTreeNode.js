
import React from 'react';
import { Row, Col, notification, Tag, Popconfirm, Icon, Button, Popover } from 'antd'
import _ from 'lodash'
import axios from 'axios';
import config from '../../config'
import colTreeActions from './ColTreeActions';
import history from '../../history'

class ColTreeNode extends React.Component {

    constructor(props) {
        super(props);
        this.setMode = this.setMode.bind(this)
        this.deleteSector = this.deleteSector.bind(this)
        this.state = {
            style: {},
            popOverVisible: false
        }
    }
    setMode = (mode) => {
        this.setState({ mode })
    }
    componentWillMount = () => {
        if (this.props.taxon.sector) {
            axios(`${config.dataApi}colsource/${this.props.taxon.sector.colSourceKey}`)
                .then((res) => {
                    this.setState({ sectorSource: res.data })
                })
                .catch((err) => {
                    this.setState({ sectorSourceError: err })
                })
        }
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

    
    deleteSector = (sector) => {
        axios.delete(`${config.dataApi}sector/${sector.key}`)
            .then(() => {
               
                this.props.reloadSelfAndSiblings();
                    notification.open({
                        message: 'Sector deleted',
                        description: `${sector.attachment.name} was deleted from the Management classification`
                    });
              
            })
            .catch(err => {
                this.setState({ error: err });
            });

    }

    render = () => {
        const { taxon, taxon : {sector}, hasPopOver, isUpdating } = this.props;
        const { mode, sectorSource } = this.state;
        const nameIsItalic = taxon.rank === "species" || taxon.rank === "genus"
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
                        {!nameIsItalic && <span >{taxon.name}</span>}
                        {nameIsItalic && <span ><em>{taxon.name}</em> {taxon.authorship}</span>}
                        {mode === 'modify' && !_.isUndefined(taxon.speciesCount) && <span> • {taxon.speciesCount} {!_.isUndefined(taxon.speciesEstimate) && <span> of {taxon.speciesEstimate} est. </span>}living species</span>}
                        {isUpdating && <span> <Icon type="sync" spin /></span>}
                        {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}
                    </Popconfirm>
                </Popover>}
                {(mode !== 'modify' || !hasPopOver) &&
                    <Popconfirm visible={this.props.confirmVisible} title={this.props.confirmTitle} onConfirm={this.props.onConfirm} onCancel={this.props.onCancel}>
                        <div>
                            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{taxon.rank}: </span>
                            {!nameIsItalic && <span >{taxon.name}</span>}
                            {nameIsItalic && <span ><em>{taxon.name}</em> {taxon.authorship}</span>}
                            {mode === 'modify' && !_.isUndefined(taxon.speciesCount) && <span> • {taxon.speciesCount} {!_.isUndefined(taxon.speciesEstimate) && <span> of {taxon.speciesEstimate} est. </span>}living species</span>}
                            {isUpdating && <span> <Icon type="sync" spin /></span>}
                            {taxon.status !== 'accepted' && <Tag color="red" style={{ marginLeft: '6px' }}>{taxon.status}</Tag>}

                            {sectorSource && sector && this.props.showSourceTaxon && <span><span> • </span>
                                <Popover
                                    content={<div><Button style={{ width: '100%' }} type="danger" onClick={() => {this.deleteSector(sector)}}>Delete mapping</Button><br />
                                        <Button style={{ marginTop: '8px', width: '100%' }} type="primary" onClick={() => this.props.showSourceTaxon(sector, sectorSource)}>Show in source tree</Button><br />
                                        <Button style={{ marginTop: '8px', width: '100%' }} type="primary" onClick={() => { history.push(`dataset/${sectorSource.datasetKey}/sources`) }}>Source Metadata</Button></div>}
                                    title="Sector Options"
                                    visible={this.state.popOverVisible}
                                    onVisibleChange={this.handleVisibleChange}
                                    trigger="click"
                                    placement="top"

                                >
                                    <Tag color="blue">{`Source: ${sectorSource.alias} ${sectorSource.title}`}</Tag>
                                </Popover></span>
                            }
                        </div>
                    </Popconfirm>}

            </div>)

    }

}

export default ColTreeNode;