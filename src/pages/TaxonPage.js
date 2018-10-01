import React from 'react';
import PropTypes from 'prop-types';
import config from '../config';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Collapse } from 'antd';
import DatasetHome from './datasetPageTabs/DatasetHome'
import SynonymTable from './taxon/Synonyms'
import VernacularNames from './taxon/VernacularNames';
import References from './taxon/References';
import Distributions from './taxon/Distributions';

import Layout from '../components/Layout'
import _ from 'lodash';


const {Panel} =  Collapse;


class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = { dataset: null, taxon: null, synonyms: null, taxonLoading: true, datasetLoading: true, synonymsLoading: true, datasetError: null, taxonError: null, synonymsError: null }
  }

  componentWillMount() {
    this.getDataset()
    this.getTaxon()
    this.getSynonyms()
    this.getInfo();
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
    axios(`${config.dataApi}dataset/${key}/taxon/${taxonKey}`)
      .then((res) => {

        this.setState({ taxonLoading: false, taxon: res.data, taxonError: null })
      })
      .catch((err) => {
        this.setState({ taxonLoading: false, taxonError: err, taxon: null })
      })
  }

  getSynonyms = () => {

    const { match: { params: { key, taxonKey } } } = this.props;

    axios(`${config.dataApi}dataset/${key}/taxon/${taxonKey}/synonyms`)
      .then((res) => {

        this.setState({ synonymsLoading: false, synonyms: res.data, synonymsError: null })
      })
      .catch((err) => {
        this.setState({ synonymsLoading: false, synonymsError: err, synonyms: null })
      })

  }

  getInfo = () => {

    const { match: { params: { key, taxonKey } } } = this.props;

    axios(`${config.dataApi}dataset/${key}/taxon/${taxonKey}/info`)
      .then((res) => {

        this.setState({ infoLoading: false, info: res.data, infoError: null })
      })
      .catch((err) => {
        this.setState({ infoLoading: false, infoError: err, info: null })
      })

  }

  render() {
    const { match: { params: { key, taxonKey } } } = this.props;
    const { datasetLoading, taxonLoading, dataset, taxon, synonyms, info } = this.state;
    return (
      <Layout selectedMenuItem="dataset" selectedDataset={dataset} selectedTaxon={taxon}>
        {taxon && <h1>Species details: {taxon.name.scientificName} {taxon.name.authorship}</h1>}

        <Collapse defaultActiveKey={['synonyms', 'vernacularNames', 'references', 'distributions']} >
          {synonyms && <Panel header="Synonyms" key="synonyms">
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
                <SynonymTable data={synonyms.homotypic} style={{ marginBottom: 16 }}></SynonymTable>
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
                <SynonymTable data={synonyms.heterotypic} style={{ marginBottom: 16 }}></SynonymTable>
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
          </Panel>}
          {info && info.vernacularNames &&
            <Panel header="Vernacular Names" key="vernacularNames">
              <VernacularNames data={info.vernacularNames}></VernacularNames>
            </Panel>}
            {info && info.references &&
            <Panel header="References" key="references">
              <References data={info.references}></References>
            </Panel>}
            {info && info.distributions &&
            <Panel header="Distributions" key="distributions">
              <Distributions data={info.distributions}></Distributions>
            </Panel>}

        </Collapse>

      </Layout>
    );
  }
}



export default TaxonPage;