import React from "react";
import PropTypes from "prop-types";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import SyncTable from "./SyncTable"
const _ = require("lodash");

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <Layout openKeys={["sectorSync"]} >
        <SyncTable  />
      </Layout>
    );
  }
}

export default Home;
