import React from 'react';
import PropTypes from 'prop-types';
import config from '../config';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Tabs } from 'antd';
import DatasetMeta from './datasetPageTabs/DatasetMeta'
import DatasetColSources from './datasetPageTabs/DatasetColSources'

import TreeExplorer from './datasetPageTabs/TreeExplorer'
import Layout from '../components/Layout2'
import history from '../history';
import DatasetTabs from './datasetPageTabs/DatasetTabs'




const TabPane = Tabs.TabPane;

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.getData = this.getData.bind(this);
    this.state = {
      data: null,
      loading: true
    }
  }

  componentWillMount() {
    
    this.getData()
  }

  getData = () => {
    const { datasetKey } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}`)
      .then((res) => {

        this.setState({ loading: false, data: res.data, err: null })
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: {} })
      })
  }

  updateSection = (section) => {
    const { match: { params: { key } } } = this.props;


    this.setState({ section: section }, () => {
      history.push(`/dataset/${key}/${section}`)
    })
  }

  render() {
    const { datasetKey, section } = this.props;
    const params = queryString.parse(this.props.location.search);
    const { loading, data } = this.state;
    return (
      <Layout selectedMenuItem="datasetKey" selectedDataset={data} section={section}>
        <DatasetTabs selectedItem={section} datasetKey={datasetKey}></DatasetTabs>
        {section === 'sources' && <DatasetColSources datasetKey={datasetKey}></DatasetColSources>}
        {section === 'meta' && <DatasetMeta id={datasetKey}></DatasetMeta>}
        {section === 'classification' && <TreeExplorer id={datasetKey} defaultExpandKey={params.taxonKey}></TreeExplorer>}
      </Layout>
    );
  }
}


export default DatasetPage;