import React from "react";
import NameSearch from "../../NameSearch";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import Helmet from "react-helmet";

const CatalogueNameSearch = ({ catalogueKey, catalogue, location }) =>
  !catalogue ? (
    <Exception404 />
  ) : (
    <Layout
    openKeys={["assembly", "projectDetails"]}
    selectedKeys={["catalogueNameSearch"]}
      title={catalogue ? catalogue.title : ""}
    >
      {_.get(catalogue, "title") && (
        <Helmet title={`${_.get(catalogue, "title")} in COL`} />
      )}
      <NameSearch datasetKey={catalogueKey} location={location} />
    </Layout>
  );

const mapContextToProps = ({ catalogueKey, catalogue }) => ({
  catalogueKey,
  catalogue
});
export default withContext(mapContextToProps)(CatalogueNameSearch);
