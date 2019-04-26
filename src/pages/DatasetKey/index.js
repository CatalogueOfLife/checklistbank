import React from "react";
import PropTypes from "prop-types";
import config from "../../config";
import { Redirect } from 'react-router-dom'
import axios from "axios";
import queryString from "query-string";
import { Alert } from "antd";
import DatasetMeta from "./datasetPageTabs/DatasetMeta";
import DatasetColSources from "./datasetPageTabs/DatasetColSources";
import DatasetImportMetrics from "../DatasetImportMetrics";

import DatasetClassification from "./datasetPageTabs/DatasetClassification";
import DatasetSectors from "./datasetPageTabs/DatasetSectors"
import Layout from "../../components/LayoutNew";
import history from "../../history";
import DatasetIssues from "./datasetPageTabs/DatasetIssues"
import NameSearch from "../NameSearch"
import WorkBench from "../WorkBench"
import withContext from "../../components/hoc/withContext"
import _ from 'lodash'
import Helmet from 'react-helmet'
import Duplicates from "../Duplicates2";

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

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
    const { datasetKey, section, dataset } = this.props;
    if (!section) return <Redirect to={{
      pathname: `/dataset/${datasetKey}/meta`
    }} />
    const sect = (!section) ? "meta" : section.split('?')[0];
    const params = queryString.parse(this.props.location.search);
    const { importState } = this.state;
    const openKeys = ['datasetKey']
    const selectedKeys = [section]
    return (
      <Layout
        selectedMenuItem="datasetKey"
        selectedDataset={dataset}
        section={section}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
      >
     {_.get(dataset, 'title') && <Helmet 
      title={`${_.get(dataset, 'title')} in CoL+`}
     />}
      { importState && importState !== 'finished' && importState !== 'failed'  && importState !== 'unchanged' &&  <Alert style={{marginTop: '16px'}} message="The dataset is currently being imported. Data may be inconsistent." type="warning" />}
      { importState && importState === 'failed' &&  <Alert style={{marginTop: '16px'}} message="Last import of this dataset failed." type="error" />}
        {/*section === "sources" && <DatasetColSources datasetKey={datasetKey} /> */}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {section === "metrics_" && <DatasetImportMetrics datasetKey={datasetKey} origin={_.get(dataset, 'origin')} />}
        {!section || section === "meta" && <DatasetMeta id={datasetKey} />}
        {section === "classification" && (
          <DatasetClassification id={datasetKey} defaultExpandKey={params.taxonKey} />
        )}
        {section === "sectors" && (
          <DatasetSectors dataset={dataset} />
        )}
        
        {sect === "names" && (
          <NameSearch datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "workbench" && (
          <WorkBench datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "duplicates" && (
          <Duplicates datasetKey={datasetKey} location={this.props.location} />
        )}
      </Layout>
    );
  }
}

const mapContextToProps = ({dataset}) => ({dataset})
export default withContext(mapContextToProps)(DatasetPage);
