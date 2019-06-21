import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import { Button, Alert, Popconfirm, notification } from "antd";

import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";
import RefForm from "./RefForm"
import RefTable from "./RefTable"
const { MANAGEMENT_CLASSIFICATION } = config;

class Reference extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ref: null,
      error: null
    };
  }



  render() {
    const {
      ref,
      error
    } = this.state;

    return (
      <Layout title="CoL+ ref">
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Reference</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
           <RefTable datasetKey={MANAGEMENT_CLASSIFICATION.key}></RefTable> 
        { /* <RefForm datasetKey={MANAGEMENT_CLASSIFICATION.key}/> */}
        </PageContent>
      </Layout>
    );
  }
}

export default Reference;
