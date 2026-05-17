import React from "react";
import Taxon from "../../Taxon";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import { Helmet } from "react-helmet-async";

const ProjectTaxon = ({ projectKey, catalogue, match, location }) =>
  !catalogue ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["catalogueTaxon"]}
      title={catalogue ? catalogue.title : ""}
      taxonOrNameKey={match.params.taxonOrNameKey}
    >
      {_.get(catalogue, "title") && (
        <Helmet title={`${_.get(catalogue, "title")} in COL`} />
      )}
      
      <Taxon datasetKey={match.params.projectKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({ projectKey, catalogue }) => ({
  projectKey,
  catalogue
});
export default withContext(mapContextToProps)(ProjectTaxon);
