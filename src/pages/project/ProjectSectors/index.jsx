import React from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";

import SectorPageContent from "./SectorPageContent";
import SectorTabs from "./SectorTabs";
const ProjectSectors = () => {
  return (
    <Layout
      selectedKeys={["projectSectors"]}
      openKeys={["assembly"]}
      title="Source sectors"
    >
      <PageContent>
        <SectorTabs />
        <SectorPageContent />
      </PageContent>
    </Layout>
  );
};

export default ProjectSectors;
