import React from "react";
import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";
import SourceMetrics from "./SourceMetrics";

class CatalogueSourceMetrics extends React.Component {
  render() {
    const {
      match: {
        params: { catalogueKey },
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
            catalogueKey={catalogueKey}
            datasetKey={catalogueKey}
            namesPath={`/catalogue/${catalogueKey}/names`}
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

export default withContext(mapContextToProps)(CatalogueSourceMetrics);
