import React from "react";
import Taxon from "../../Taxon";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import { Helmet } from "react-helmet-async";

const ProjectTaxon = ({ projectKey, project, match, location }) =>
  !project ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["projectTaxon"]}
      title={project ? project.title : ""}
      taxonOrNameKey={match.params.taxonOrNameKey}
    >
      {_.get(project, "title") && (
        <Helmet title={`${_.get(project, "title")} in COL`} />
      )}
      
      <Taxon datasetKey={match.params.projectKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project
});
export default withContext(mapContextToProps)(ProjectTaxon);
