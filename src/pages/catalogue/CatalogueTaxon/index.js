import React from "react";
import Taxon from "../../Taxon";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import Helmet from "react-helmet";

const CatalogueTaxon = ({ catalogueKey, catalogue, match, location }) =>
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
        <Helmet title={`${_.get(catalogue, "title")} in CoL+`} />
      )}
      
      <Taxon datasetKey={catalogueKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({ catalogueKey, catalogue }) => ({
  catalogueKey,
  catalogue
});
export default withContext(mapContextToProps)(CatalogueTaxon);
