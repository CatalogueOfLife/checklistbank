import React from "react";
import PropTypes from "prop-types";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import ImportTable from "./importTabs/ImportTable"
import withContext from '../../components/hoc/withContext'

const _ = require("lodash");

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { section, importState } = this.props;
    
    return (
      <Layout openKeys={["imports"]} selectedKeys={[section]} title={`${_.startCase(section)} imports`}>
        {section === "running" && <ImportTable importState={importState.filter(i => i.running === "true").map(i => i.name)} section={section} />}
        {section === "finished" && <ImportTable importState={importState.filter(i => i.running === "false").map(i => i.name)} section={section} />}
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, importState }) => ({ user, importState });
export default withContext(mapContextToProps)(Home);

