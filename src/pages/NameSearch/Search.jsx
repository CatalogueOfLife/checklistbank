import React from "react";
import Layout from "../../components/LayoutNew";
import withRouter from "../../withRouter";
import NameSearch from "./index";
const NameUsageSearch = ({ location }) => {
  return (
    <Layout selectedKeys={"nameUsageSearch"} title="Name Usage Search">
      <NameSearch location={location} />
    </Layout>
  );
};

export default withRouter(NameUsageSearch);
