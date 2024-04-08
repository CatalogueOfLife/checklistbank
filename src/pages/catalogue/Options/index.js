import React from "react";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Button,
  Alert,
  Popconfirm,
  Switch,
  notification,
} from "antd";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import BooleanValue from "../../../components/BooleanValue";
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";
import DeleteOrphansButton from "./DeleteOrphansButton";
import DeleteDatasetButton from "../../DatasetKey/datasetPageTabs/DeleteDatasetButton";
import Auth from "../../../components/Auth";
import OptionTabs from "./OptionTabs";
import Options from "./Options";
import Publishers from "./Publishers";

const CatalogueOptions = ({ catalogue, location }) => {
  return (
    <Layout
      selectedKeys={["catalogueOptions"]}
      openKeys={["assembly"]}
      title={catalogue ? catalogue.title : ""}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>Options</title>
      </Helmet>
      <PageContent>
        {/*         <OptionTabs />
         */}{" "}
        {location?.pathname.endsWith("options") && <Options />}
        {location?.pathname.endsWith("publishers") && <Publishers />}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogue, datasetSettings, user }) => ({
  catalogue,
  datasetSettings,
  user,
});
export default withContext(mapContextToProps)(withRouter(CatalogueOptions));
