import React from "react";
import Layout from "../../components/LayoutNew";
import withRouter from "../../withRouter";
import NameSearch from "./index";
const NameUsageSearch = ({ location }) => {
  return (
    <Layout selectedKeys={"nameUsageSearch"}>
      <NameSearch location={location} />
    </Layout>
  );
};

export default withRouter(NameUsageSearch);
