import React from "react";
import PropTypes from "prop-types";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import Layout from "../../components/Layout";
import MetaDataForm from "../../components/MetaDataForm";
import history from "../../history";

const _ = require("lodash");

class DatasetCreate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Layout selectedMenuItem="datasetCreate">
        <MetaDataForm
          onSaveSuccess={() => {
            history.push("/dataset");
          }}
        />
      </Layout>
    );
  }
}

export default DatasetCreate;
