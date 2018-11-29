import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Collapse, Alert, Spin, Breadcrumb } from 'antd';
import SynonymTable from './Synonyms'
import VernacularNames from './VernacularNames';
import References from './References';
import Distributions from './Distributions';
import Classification from './Classification';
import ErrorMsg from '../../components/ErrorMsg';

import Layout from '../../components/LayoutNew'
import _ from 'lodash';


const {Panel} =  Collapse;


class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = { dataset: null, taxon: null, synonyms: null, info: null, taxonLoading: true, datasetLoading: true, synonymsLoading: true, infoLoading: true, classificationLoading:true, infoError: null, datasetError: null, taxonError: null, synonymsError: null, classificationError: null }
  }

  componentWillMount() {
    this.getDataset()
    this.getTaxon()
    this.getSynonyms()
    this.getInfo();
    this.getClassification();
  }

  getDataset = () => {
    const { match: { params: { key } } } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {

        this.setState({ datasetLoading: false, dataset: res.data, datasetError: null })
      })
      .catch((err) => {
        this.setState({ datasetLoading: false, datasetError: err, dataset: null })
      })
  }
  getTaxon = () => {
    const { match: { params: { key, taxonKey } } } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(taxonKey)}`)
      .then((res) => {

        this.setState({ taxonLoading: false, taxon: res.data, taxonError: null })
      })
      .catch((err) => {
        this.setState({ taxonLoading: false, taxonError: err, taxon: null })
      })
  }

  getSynonyms = () => {

    const { match: { params: { key, taxonKey } } } = this.props;

    axios(`${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(taxonKey)}/synonyms`)
      .then((res) => {

        this.setState({ synonymsLoading: false, synonyms: res.data, synonymsError: null })
      })
      .catch((err) => {
        this.setState({ synonymsLoading: false, synonymsError: err, synonyms: null })
      })

  }

  getInfo = () => {

    const { match: { params: { key, taxonKey } } } = this.props;

    axios(`${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(taxonKey)}/info`)
      .then((res) => {

        this.setState({ infoLoading: false, info: res.data, infoError: null })
      })
      .catch((err) => {
        this.setState({ infoLoading: false, infoError: err, info: null })
      })

  }

  getClassification = () => {

    const { match: { params: { key, taxonKey } } } = this.props;

    axios(`${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(taxonKey)}/classification`)
      .then((res) => {

        this.setState({ classificationLoading: false, classification: res.data, classificationError: null })
      })
      .catch((err) => {
        this.setState({ classificationLoading: false, classificationError: err, classification: null })
      })

  }

  render() {
    const { match: { params: { key, taxonKey } } } = this.props;
    const { datasetLoading, taxonLoading, classificationLoading, synonymsLoading, infoLoading, dataset, taxon, synonyms, info, classification, datasetError, taxonError, synonymsError, classificationError, infoError } = this.state;
    return (
      <Layout 
      selectedDataset={dataset} 
      selectedTaxon={taxon}
      openKeys={['dataset', 'datasetKey']}
      selectedKeys={["taxon"]}
      >
      <React.Fragment>
      {dataset && taxon &&  <Breadcrumb>
         <Breadcrumb.Item>
         <NavLink to={{ pathname: `/dataset` }}>
                                                 Dataset
                                                     </NavLink>
         </Breadcrumb.Item>
         <Breadcrumb.Item>
         <NavLink to={{ pathname: `/dataset/${dataset.key}/metrics` }}>
         {dataset.title}
                                                     </NavLink>
          
         </Breadcrumb.Item>
         <Breadcrumb.Item>
         <NavLink to={{ pathname: `/dataset/${dataset.key}/classification` }}>
         Classification
                                                     </NavLink>
          
         </Breadcrumb.Item>
         <Breadcrumb.Item>
         {taxon.name.scientificName}
          
         </Breadcrumb.Item>
   
       </Breadcrumb>}

              <div style={{ background: '#fff', padding: 24, minHeight: 280, margin: '16px 0' }}>

        {taxon && <h1>Taxon details: {taxon.name.scientificName} {taxon.name.authorship}</h1>}

        <Collapse defaultActiveKey={['synonyms', 'vernacularNames', 'references', 'distributions', 'classification']} >
          <Panel header="Synonyms" key="synonyms">
          {synonymsLoading && <Spin />}
          {synonymsError && <Alert message={<ErrorMsg error={synonymsError}></ErrorMsg>} type="error" />}
          {synonyms && _.isEmpty(synonyms) && <p>None</p>}
          {synonyms && !_.isEmpty(synonyms) && <div>
            {synonyms.homotypic &&
              <div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(0, 0, 0, 0.85)',
                    marginBottom: 16,
                    fontWeight: 500,
                  }}
                >
                  Homotypic
                </p>
                <SynonymTable data={synonyms.homotypic} style={{ marginBottom: 16 }} datasetKey={key}></SynonymTable>
              </div>}
            {synonyms.heterotypic &&
              <div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(0, 0, 0, 0.85)',
                    marginBottom: 16,
                    fontWeight: 500,
                  }}
                >
                  Heterotypic
                </p>
                <SynonymTable data={synonyms.heterotypic} style={{ marginBottom: 16 }} datasetKey={key}></SynonymTable>
              </div>}
            {synonyms.misapplied &&
              <div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(0, 0, 0, 0.85)',
                    marginBottom: 16,
                    fontWeight: 500,
                  }}
                >
                  Misapplied
                </p>
                <SynonymTable data={synonyms.misapplied} style={{ marginBottom: 16 }}></SynonymTable>
              </div>}
              </div> }
          </Panel>
          
            <Panel header="Vernacular Names" key="vernacularNames">
            {infoLoading && <Spin />}
            {infoError && <Alert message={<ErrorMsg error={infoError}></ErrorMsg>} type="error" />}
            {info && !info.vernacularNames && <p>None</p>}
            {info && info.vernacularNames && <VernacularNames data={info.vernacularNames}></VernacularNames>}
            </Panel>
            
            <Panel header="References" key="references">
            {infoLoading && <Spin />}
            {info && !info.references && <p>None</p>}
            {infoError && <Alert message={<ErrorMsg error={infoError}></ErrorMsg>} type="error" />}
              {info && info.references && <References data={info.references}></References> }
            </Panel>
            
            <Panel header="Distributions" key="distributions">
            {infoLoading && <Spin />}
            {info && !info.distributions && <p>None</p>}
            {infoError && <Alert message={<ErrorMsg error={infoError}></ErrorMsg>} type="error" />}
            {info && info.distributions && <Distributions data={info.distributions}></Distributions> }
            </Panel>
            
            <Panel header="Classification" key="classification">
            {classificationLoading && <Spin />}
            {classificationError && <Alert message={<ErrorMsg error={classificationError}></ErrorMsg>} type="error" />}
            {classification  && <Classification data={classification} datasetKey={key}></Classification>}
            </Panel>

        </Collapse>
  </div>
  </React.Fragment>
      </Layout>
     
    );
  }
}



export default TaxonPage;