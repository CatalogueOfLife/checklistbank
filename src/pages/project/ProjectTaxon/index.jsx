import React from "react";
import Taxon from "../../Taxon";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import withRouter from "../../../withRouter";
import Exception404 from "../../../components/exception/404";

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
      
      <Taxon datasetKey={match.params.projectKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project
});
export default withRouter(withContext(mapContextToProps)(ProjectTaxon));
