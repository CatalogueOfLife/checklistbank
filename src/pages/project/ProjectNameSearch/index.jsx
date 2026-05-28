import React from "react";
import NameSearch from "../../NameSearch";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import withRouter from "../../../withRouter";
import Exception404 from "../../../components/exception/404";
import _ from "lodash";
import { Helmet } from "react-helmet-async";

const ProjectNameSearch = ({ projectKey, project, location }) =>
  !project ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["projectNameSearch"]}
      title={project ? project.title : ""}
    >
      {_.get(project, "title") && (
        <Helmet title={`${_.get(project, "title")} in COL`} />
      )}
      <NameSearch datasetKey={projectKey} location={location} />
    </Layout>
  );

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project
});
export default withRouter(withContext(mapContextToProps)(ProjectNameSearch));
