import React from "react";
import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import DatasetDownload from "../../Download";
const ProjectDownload = ({
  match: {
    params: { key },
  },
  location,
  project,
}) => {
  return (
    <Layout
      selectedKeys={["projectDownload"]}
      openKeys={["assembly"]}
      title="Project download"
    >
      <PageContent>
        <DatasetDownload
          downloadKey={key}
          dataset={project}
          location={location}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ project, user }) => ({ project, user });

export default withRouter(withContext(mapContextToProps)(ProjectDownload));
