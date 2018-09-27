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





const TabPane = Tabs.TabPane;

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.getData = this.getData.bind(this);
    this.state = { data: null, loading: true}
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


  render() {
    const { match: { params: { key } } } = this.props;
    const {loading, data} = this.state;
    return (
      <Layout selectedMenuItem="dataset" selectedDataset={data}>
        <Tabs defaultActiveKey="1" >
          <TabPane tab="View/Edit Meta Data" key="1">
            <DatasetHome id={key}></DatasetHome></TabPane>
          <TabPane tab="Explore Taxonomy" key="2"><TreeExplorer id={key}></TreeExplorer></TabPane>
          <TabPane tab="Search names" key="3">Search names here</TabPane>
        </Tabs>
      </Layout>
    );
  }
}



export default DatasetPage;