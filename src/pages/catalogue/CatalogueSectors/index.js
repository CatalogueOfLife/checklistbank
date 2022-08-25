import React from "react";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";
import Auth from "../../../components/Auth";

import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";

import SectorPageContent from "./SectorPageContent";

const CatalogueSectors = () => {
  return (
    <Layout
      selectedKeys={["catalogueSectors"]}
      openKeys={["assembly"]}
      title="Project sectors"
    >
      <PageContent>
          <SectorPageContent />
      </PageContent>
    </Layout>
  );
};

export default CatalogueSectors;
