import React from "react";
import Name from "../../Name";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import Helmet from "react-helmet";

const CatalogueName = ({  catalogue, match, location }) =>
  !catalogue ? (
    <Exception404 />
  ) : (
    <Layout
    openKeys={["assembly", "projectDetails"]}
    selectedKeys={["catalogueName"]}
      title={catalogue ? catalogue.title : ""}
      taxonOrNameKey={match.params.taxonOrNameKey}
    >
      {_.get(catalogue, "title") && (
        <Helmet title={`${_.get(catalogue, "title")} in COL`} />
      )}

      <Name datasetKey={match.params.catalogueKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({  catalogue }) => ({
  
  catalogue
});
export default withContext(mapContextToProps)(CatalogueName);
