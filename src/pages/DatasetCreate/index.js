import React from "react";
import PropTypes from "prop-types";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import MetaDataForm from "../../components/MetaDataForm";
import history from "../../history";
import PageContent from '../../components/PageContent'

const _ = require("lodash");

class DatasetCreate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Layout 
        openKeys={["dataset"]}
        selectedKeys={["datasetCreate"]}>
        <PageContent>
          
        <MetaDataForm
          onSaveSuccess={(res) => {
            history.push(`/dataset/${res.data}/meta`);
          }}
        />
        </PageContent>
      </Layout>
    );
  }
}

export default DatasetCreate;
