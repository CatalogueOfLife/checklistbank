import React from "react";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import ProfileList from "./ProfileList";

const SectorProfiles = ({ project, projectKey, user }) => (
  <Layout selectedKeys={["projectSectors"]} openKeys={["assembly"]} title={project ? project.title : ""}>
    <PageContent>
      <SectorTabs />
      {projectKey && (
        <ProfileList datasetKey={projectKey} readOnly={!Auth.canEditDataset({ key: projectKey }, user)} />
      )}
    </PageContent>
  </Layout>
);

const mapContextToProps = ({ project, projectKey, user }) => ({ project, projectKey, user });

export default withContext(mapContextToProps)(SectorProfiles);
