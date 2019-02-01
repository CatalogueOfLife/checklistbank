import React from "react";
import PropTypes from "prop-types";
import config from "../../config";
import { Redirect } from 'react-router-dom'
import axios from "axios";
import queryString from "query-string";
import { Alert } from "antd";
import DatasetMeta from "./datasetPageTabs/DatasetMeta";
import DatasetColSources from "./datasetPageTabs/DatasetColSources";
import DatasetImportMetrics from "./datasetPageTabs/DatasetImportMetrics";

import TreeExplorer from "./datasetPageTabs/TreeExplorer";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import DatasetIssues from "./datasetPageTabs/DatasetIssues"
import NameSearch from "../NameSearch"
import WorkBench from "../WorkBench"

import _ from 'lodash'
import Helmet from 'react-helmet'

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.getData = this.getData.bind(this);
    this.state = {
      data: null,
      loading: true,
      importState: null
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

      axios(`${config.dataApi}dataset/${datasetKey}/import`)
      .then(res => {
        const importState = _.get(res, 'data[0].state')
        this.setState({ importState });
      })
      .catch(err => {
        this.setState({ importState: null });
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
    if (!section) return <Redirect to={{
      pathname: `/dataset/${datasetKey}/meta`
    }} />
    const sect = (!section) ? "meta" : section.split('?')[0];
    const params = queryString.parse(this.props.location.search);
    const { loading, data, importState } = this.state;
    const openKeys = ['datasetKey']
    const selectedKeys = [section]
    return (
      <Layout
        selectedMenuItem="datasetKey"
        selectedDataset={data}
        section={section}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
      >
      <Helmet>
          <meta charSet="utf-8" />
          <title>{_.get(data, 'title') ? `${_.get(data, 'title')}`: ''} in CoL+</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
      { importState && importState !== 'finished' && importState !== 'failed' &&  <Alert style={{marginTop: '16px'}} message="The dataset is currently being imported. Data may be inconsistent." type="warning" />}
      { importState && importState === 'failed' &&  <Alert style={{marginTop: '16px'}} message="Last import of this dataset failed." type="error" />}
        {section === "sources" && <DatasetColSources datasetKey={datasetKey} />}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {section === "metrics" && <DatasetImportMetrics datasetKey={datasetKey} origin={_.get(this.state, 'data.origin')} />}
        {!section || section === "meta" && <DatasetMeta id={datasetKey} />}
        {section === "classification" && (
          <TreeExplorer id={datasetKey} defaultExpandKey={params.taxonKey} />
        )}
        {sect === "names" && (
          <NameSearch datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "workbench" && (
          <WorkBench datasetKey={datasetKey} location={this.props.location} />
        )}
      </Layout>
    );
  }
}

export default DatasetPage;
