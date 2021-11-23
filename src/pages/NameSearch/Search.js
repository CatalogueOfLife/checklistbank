import React from "react";
import Layout from "../../components/LayoutNew";
import { withRouter } from "react-router";
import NameSearch from "./index";
const NameUsageSearch = ({ location }) => {
  return (
    <Layout selectedKeys={"NameUsageSearch"}>
      <NameSearch location={location} />
    </Layout>
  );
};

export default withRouter(NameUsageSearch);
