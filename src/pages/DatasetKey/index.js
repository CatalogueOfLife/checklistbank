import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import { Tabs } from "antd";
import DatasetMeta from "./datasetPageTabs/DatasetMeta";
import DatasetColSources from "./datasetPageTabs/DatasetColSources";
import DatasetImportMetrics from "./datasetPageTabs/DatasetImportMetrics";

import TreeExplorer from "./datasetPageTabs/TreeExplorer";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import DatasetIssues from "./datasetPageTabs/DatasetIssues"
import NameSearch from "../NameSearch"
class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.getData = this.getData.bind(this);
    this.state = {
      data: null,
      loading: true
    };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { datasetKey } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}`)
      .then(res => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  updateSection = section => {
    const {
      match: {
        params: { key }
      }
    } = this.props;

    this.setState({ section: section }, () => {
      history.push(`/dataset/${key}/${section}`);
    });
  };

  render() {
    const { datasetKey, section } = this.props;
    const sect = section.split('?')[0];
    const params = queryString.parse(this.props.location.search);
    const { loading, data } = this.state;
    const openKeys = ['dataset', 'datasetKey']
    const selectedKeys = [section]
    return (
      <Layout
        selectedMenuItem="datasetKey"
        selectedDataset={data}
        section={section}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
      >
        {section === "sources" && <DatasetColSources datasetKey={datasetKey} />}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {section === "metrics" && <DatasetImportMetrics datasetKey={datasetKey} />}
        {section === "meta" && <DatasetMeta id={datasetKey} />}
        {section === "classification" && (
          <TreeExplorer id={datasetKey} defaultExpandKey={params.taxonKey} />
        )}
        {sect === "names" && (
          <NameSearch datasetKey={datasetKey} location={this.props.location} />
        )}
      </Layout>
    );
  }
}

export default DatasetPage;
