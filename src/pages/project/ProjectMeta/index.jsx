import React from "react";

import DatasetMeta from "./../../DatasetKey/datasetPageTabs/DatasetMeta";

import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext"
import Exception404 from "../../../components/exception/404";

import _ from 'lodash'
import { Helmet } from "react-helmet-async";


const ProjectMeta = ({ projectKey, project }) => (
  !project ? <Exception404 /> :
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["projectMeta"]}
      title={project ? project.title : ''}
    >
      {_.get(project, 'title') && <Helmet
        title={`${_.get(project, 'title')} in COL`}
      />}


      <DatasetMeta id={projectKey} />


    </Layout>
);





const mapContextToProps = ({ projectKey, project }) => ({ projectKey, project })
export default withContext(mapContextToProps)(ProjectMeta);
