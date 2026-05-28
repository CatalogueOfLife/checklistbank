import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import SourceMetrics from "./SourceMetrics";

const ProjectSourceMetrics = ({ match, project }) => {
  const projectKey = match.params.projectKey;

  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["catalogueSourceMetrics"]}
      title={project ? project.title : ""}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <SourceMetrics
          isProject={true}
          projectKey={projectKey}
          datasetKey={projectKey}
          basePath={`/project/${projectKey}`}
        />
      </div>
    </Layout>
  );
};

const mapContextToProps = ({ user, rank, project }) => ({
  user,
  rank,
  project,
});

export default withRouter(withContext(mapContextToProps)(ProjectSourceMetrics));
