import React from "react";
import PropTypes from "prop-types";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import ImportTable from "./importTabs/ImportTable"
const _ = require("lodash");

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { section } = this.props;

    return (
      <Layout openKeys={["imports"]} selectedKeys={[section]}>
        {section === "running" && <ImportTable importState={['processing', 'downloading', 'inserting']} section={section} />}
        {section === "failed" && <ImportTable importState={['failed']} section={section} />}
      </Layout>
    );
  }
}

export default Home;
