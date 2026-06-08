import React from "react";
import Name from "../../Name";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import withRouter from "../../../withRouter";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import { Helmet } from "react-helmet-async";

const ProjectName = ({ project, match, location }) =>
  !project ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["projectName"]}
      title={project ? project.title : ""}
      taxonOrNameKey={match.params.taxonOrNameKey}
    >
      {_.get(project, "title") && (
        <Helmet title={`${_.get(project, "title")} in COL`} />
      )}

      <Name datasetKey={match.params.projectKey} location={location} match={match} />
    </Layout>
  );

const mapContextToProps = ({ project }) => ({

  project
});
export default withRouter(withContext(mapContextToProps)(ProjectName));
