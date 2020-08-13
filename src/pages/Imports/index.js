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
    const { section, importState, location } = this.props;
    
    return (
      <Layout openKeys={["imports"]} selectedKeys={[section]} title={`${_.startCase(section)} imports`}>
        {section === "running" && <ImportTable importState={importState.filter(i => i.running === "true" || i.running === true || i.name === "waiting" ).map(i => i.name)} section={section} location={location}  />}
        {section === "finished" && <ImportTable importState={importState.filter(i => i.running === "false" || i.running === false && i.name !== "waiting").map(i => i.name)} section={section} location={location} />}
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, importState }) => ({ user, importState });
export default withContext(mapContextToProps)(Home);

