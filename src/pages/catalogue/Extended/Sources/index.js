import React, { useState, useEffect } from "react";
import config from "../../../config";
import withRouter from "../../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import SectorPageContent from "../../CatalogueSectors/SectorPageContent";
import { Table, Row, Col, Tag, Button, Radio, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import Userautocomplete from "./UserAutocomplete";
import axios from "axios";

const ExtendedSources = ({
    projectKey,
    catalogue,
    addError,
  }) => {
  
    return (
      <Layout
        selectedKeys={["extendedSources"]}
        openKeys={["assembly", "extended"]}
        title={catalogue ? catalogue.title : ""}
      >
        <PageContent>
            <SectorPageContent />
        </PageContent>
      </Layout>
    );
  };
  
  const mapContextToProps = ({
    user,
    projectKey,
    catalogue,
    addError,
  }) => ({
    user,
    projectKey,
    catalogue,
    addError,
  });
  
  export default withContext(mapContextToProps)(ExtendedSources);