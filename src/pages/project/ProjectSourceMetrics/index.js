import React from "react";
import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import SourceMetrics from "./SourceMetrics";

class ProjectSourceMetrics extends React.Component {
  render() {
    const {
      match: {
        params: { projectKey },
      },
      catalogue,
    } = this.props;

    return (
      <Layout
        openKeys={["assembly"]}
        selectedKeys={["catalogueSourceMetrics"]}
        title={catalogue ? catalogue.title : ""}
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
  }
}

const mapContextToProps = ({ user, rank, catalogue }) => ({
  user,
  rank,
  catalogue,
});

export default withRouter(withContext(mapContextToProps)(ProjectSourceMetrics));
