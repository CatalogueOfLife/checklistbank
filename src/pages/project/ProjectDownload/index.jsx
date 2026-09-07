import React from "react";
import { Row, Spin } from "antd";
import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { datasetMatchesRoute } from "../../../components/util/datasetRouteMatch";
import DatasetDownload from "../../Download";

// On /project/:projectKey/download/:key? it is `projectKey` that names the
// dataset - `key` is the export uuid. `project` comes from context and lags the
// route, so gate on it matching before letting the form run.
const ProjectDownload = ({
  match: {
    params: { key, projectKey },
  },
  location,
  project,
}) => {
  const projectLoaded = datasetMatchesRoute(project, projectKey);

  return (
    <Layout
      selectedKeys={["projectDownload"]}
      openKeys={["assembly"]}
      title="Project download"
    >
      <PageContent>
        {projectLoaded ? (
          <DatasetDownload
            downloadKey={key}
            datasetKey={projectKey}
            dataset={project}
            location={location}
          />
        ) : (
          <Row justify="center" style={{ marginTop: "24px" }}>
            <Spin size="large" />
          </Row>
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ project, user }) => ({ project, user });

export default withRouter(withContext(mapContextToProps)(ProjectDownload));
