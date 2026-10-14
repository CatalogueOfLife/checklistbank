import React from "react";
import NameSearch from "../../NameSearch";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import withRouter from "../../../withRouter";
import Exception404 from "../../../components/exception/404";

const ProjectNameSearch = ({ projectKey, project, location }) =>
  !project ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["projectNameSearch"]}
      title={project ? project.title : ""}
    >
      <NameSearch
        datasetKey={projectKey}
        location={location}
        showSourceDataset
      />
    </Layout>
  );

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project
});
export default withRouter(withContext(mapContextToProps)(ProjectNameSearch));
