import React from "react";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";
import Auth from "../../../components/Auth";

import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";

import SectorPageContent from "./SectorPageContent";
import SectorTabs from "./SectorTabs"
const CatalogueSectors = () => {
  return (
    <Layout
      selectedKeys={["catalogueSectors"]}
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

export default CatalogueSectors;
