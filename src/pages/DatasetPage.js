import React from 'react';
import PropTypes from 'prop-types';
import config from '../config';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Tabs } from 'antd';
import DatasetHome from './datasetPageTabs/DatasetHome'
import TreeExplorer from './datasetPageTabs/TreeExplorer'
import Layout from '../components/Layout'
import history from '../history';





const TabPane = Tabs.TabPane;

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);
    const { match: { params: { section } } } = this.props;

    this.getData = this.getData.bind(this);
    this.state = { 
      data: null, 
      loading: true,
      section: section || 'meta'
    }
  }

  componentWillMount() {
    this.getData()
}

  getData = () => {
    const { match: { params: { key } } } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
        .then((res) => {

            this.setState({ loading: false, data: res.data, err: null })
        })
        .catch((err) => {
            this.setState({ loading: false, error: err, data: {} })
        })
}

updateSection = (section) => {
  const { match: { params: { key } } } = this.props;

  
  this.setState({section: section}, ()=>{
    history.push(`/dataset/${key}/${section}`)
  } )
}

  render() {
    const { match: { params: { key } } } = this.props;
    const params = queryString.parse(this.props.location.search);
    const {loading, data, section} = this.state;
    return (
      <Layout selectedMenuItem="datasetKey" selectedDataset={data} section={section}>
        <Tabs onChange={this.updateSection} activeKey={section}>
          <TabPane tab="View/Edit Meta Data" key="meta">
            <DatasetHome id={key}></DatasetHome>
            </TabPane>
          <TabPane tab="Classification" key="classification"><TreeExplorer id={key} defaultExpandKey={params.taxonKey}></TreeExplorer></TabPane>
          <TabPane tab="Search names" key="names">Search names here - awaiting ES api</TabPane>
        </Tabs>
      </Layout>
    );
  }
}



export default DatasetPage;