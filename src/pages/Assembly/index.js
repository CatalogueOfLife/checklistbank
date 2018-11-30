import React from 'react';
import { Row, Col, notification,Input, Button, Alert, Card } from 'antd'
import _ from 'lodash'
import Layout from '../../components/LayoutNew'
import axios from 'axios';
import config from '../../config'
import colTreeActions from './ColTreeActions';
import ErrorMsg from '../../components/ErrorMsg';
import ColTree from './ColTree'
import DatasetAutocomplete from './DatasetAutocomplete'
import PageContent from '../../components/PageContent'


import SectorModal from './SectorModal'

const Search = Input.Search;


const MANAGEMENT_CLASSIFICATION = {key: 3, title: 'Management Classification'};



class ManagementClassification extends React.Component {
    constructor(props) {
        super(props);
        
        this.saveSector = this.saveSector.bind(this)
        this.showSourceTaxon = this.showSourceTaxon.bind(this)

        this.state = {
            datasets: [],
            mode: 'attach'
        }
    }


    getSectorInfo = (attachment, root, mode) => {
        // get the ColSources for the dataset  
        const { datasetKey } = this.state;
        return axios.all([
            axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`),
            axios(`${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION.key}/taxon/${encodeURIComponent(attachment.props.dataRef.key)}`),
            axios(`${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(root.props.dataRef.key)}`),
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
                    return this.saveSector(colsources.data[0], rootName.data, attachmentName.data, mode)
                }


            }))

            .catch((err) => {
                this.setState({ sectorMappingError: err })
                console.log(err)
            });

    }

    saveSector = (source, subject, target, mode) => {
        
        return axios.post(`${config.dataApi}sector`, { colSourceKey: source.key, subject: subject, target: target, mode: mode })
            .then((res) => {
                const msg = `${target.name || target.id} attached to ${subject.name || subject.id} using colSource ${source.title} (${source.alias})`;
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
    
    showSourceTaxon = (sector, source) =>{
        axios(`${config.dataApi}dataset/${source.datasetKey}`)
            .then((res)=>{
                this.setState({ defaultExpandKey: sector.root.id, datasetKey: source.datasetKey, datasetName: res.data.title, selectedDataset: {key: res.data.key, title: res.data.title}})
 
            })
            .catch((err) => {
                console.log(err)
            });


    }

    onSelectDataset = (dataset) => {
        this.setState({ datasetKey: dataset.key, datasetName: dataset.title, selectedDataset: dataset, defaultExpandKey: null})
    }

    
    onDragStart = (e, dataset) => {
        e.node.dataset = dataset
        this.setState({ dragNode: e.node })
    }


    toggleMode = (mode) => {
        this.setState({ mode: mode })
        colTreeActions.changeMode(mode)
    }
    cancelSectorModal = () => {
        this.setState({ sectorModal: null })
    }
    render() {


        return (
            <Layout 
            openKeys={[]}
            selectedKeys={["assembly"]}
            >
            <PageContent>
                <Row style={{paddingLeft: '16px'}}>
                    <Button type={this.state.mode === 'modify' ? 'primary' : ''} onClick={() => this.toggleMode('modify')} size="large" style={{ marginBottom: '20px' }} disabled>Modify Tree</Button>
                    <Button style={{marginLeft: '10px', marginBottom: '20px'}} type={this.state.mode === 'attach' ? 'primary' : ''} onClick={() => this.toggleMode('attach')} size="large" >Attach sectors</Button>

                </Row>
                <Row style={{padding: '10px', height:'100%'}}>
                    <Col span={12} style={{padding: '10px'}}>
                    <Card >
                    <h4>CoL Draft</h4>  <Search
                            placeholder="Find taxon (not yet functional)"
                            onSearch={value => console.log(value)}
                            style={{  width: '100%' }}
                        />

                        <div style={{ overflowY: 'scroll', height: '800px' }}>
                        <ColTree 
                            dataset={MANAGEMENT_CLASSIFICATION}
                            treeType='mc'
                            attachFn={this.getSectorInfo}
                            onDragStart={(e)=>this.onDragStart(e, MANAGEMENT_CLASSIFICATION)}
                            dragNode={this.state.dragNode}
                            draggable={true}
                            showSourceTaxon={this.showSourceTaxon}
                            ></ColTree>
                       
                    </div>
                    </Card>
                    
                    </Col>
                    <Col span={12} style={{padding: '10px'}}>
                    <Card >
                    <h4>{this.state.selectedDataset ? this.state.selectedDataset.title : 'No dataset selected'}</h4>
                        <DatasetAutocomplete onSelectDataset={this.onSelectDataset} ></DatasetAutocomplete>
             
                        <br/>
                        {this.state.selectedDataset &&  <Search
                            placeholder="Find taxon (not yet functional)"
                            onSearch={value => console.log(value)}
                            style={{ width: '100%' }}
                        />}
                            <div style={{ overflowY: 'scroll', height: '800px' }}>
                        
                       {this.state.selectedDataset && <ColTree 
                            dataset={this.state.selectedDataset}
                            treeType='gsd'
                            onDragStart={(e)=>this.onDragStart(e, this.state.selectedDataset)}
                            draggable={this.state.mode === 'attach'}
                            defaultExpandKey={this.state.defaultExpandKey}
                            ></ColTree>}

                    </div>
                    </Card>
                    </Col>
                </Row>


              {this.state.sectorModal &&  <SectorModal 
                    title={_.get(this.state, 'sectorModal.title')} 
                    options={_.get(this.state, 'sectorModal.options')}
                    onCancel={() => this.setState({ sectorModal: null })}
                    onChange={(value) => this.saveSector(_.find(_.get(this.state, 'sectorModal.options'), (o)=>{ return o.key === value}), _.get(this.state, 'sectorModal.root'), _.get(this.state, 'sectorModal.attachment')) }
                    options={_.get(this.state, 'sectorModal.options')}
                    datasetKey={_.get(this.state, 'sectorModal.datasetKey')} />}

</PageContent>
            </Layout>
        );
    }
}



export default ManagementClassification;