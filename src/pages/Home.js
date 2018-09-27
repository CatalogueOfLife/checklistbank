import React from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import queryString from 'query-string';
import { NavLink } from "react-router-dom";
import Layout from '../components/Layout'


const _ = require('lodash')


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
 
  }

 


  getData() {
    
  }

  render() {
    
    
    
    return (
      <Layout selectedMenuItem="home">
        <div  >Home</div>
        </Layout>
    );
  }
}



export default Home;