import React from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import { Tabs } from 'antd';
import DatasetHome from './datasetPageTabs/DatasetHome'




const TabPane = Tabs.TabPane;

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);
 
  }


  render() {
    const { match: { params: { key } } } = this.props;


    
    return (
        
     <Tabs defaultActiveKey="1" >
    <TabPane tab="Meta Data" key="1">
    <DatasetHome id={key}></DatasetHome></TabPane>
    <TabPane tab="Tab 2" key="2">Content of Tab Pane 2</TabPane>
    <TabPane tab="Tab 3" key="3">Content of Tab Pane 3</TabPane>
  </Tabs>
    );
  }
}



export default DatasetPage;