import React from "react";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import DatasetDownload from "../../Download";
const CatalogueDownload = ({
  match: {
    params: { key },
  },
  location,
  catalogue,
}) => {
  return (
    <Layout
      selectedKeys={["catalogueDownload"]}
      openKeys={["assembly"]}
      title="Project download"
    >
      <PageContent>
        <DatasetDownload
          downloadKey={key}
          dataset={catalogue}
          location={location}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogue, user }) => ({ catalogue, user });

export default withContext(mapContextToProps)(CatalogueDownload);
