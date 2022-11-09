import React from "react";
import config from "../../config";
import { Redirect } from "react-router-dom";
import axios from "axios";
import { Alert, Row, Col, Button } from "antd";
import DatasetMeta from "./datasetPageTabs/DatasetMeta";
import DatasetImportMetrics from "../DatasetImportMetrics";

import DatasetClassification from "./datasetPageTabs/DatasetClassification";
import DatasetProjects from "./datasetPageTabs/DatasetProjects";
import Auth from "../../components/Auth";
import DatasetReferences from "./datasetPageTabs/DatasetReferences";
import Layout from "../../components/LayoutNew";
import DatasetIssues from "./datasetPageTabs/DatasetIssues";
import DatasetTasks from "./datasetPageTabs/DatasetTasks";
import DatasetOptions from "./datasetPageTabs/DatasetOptions";
import DatasetDiff from "./datasetPageTabs/DatasetImportDiff";
import DatasetImportTree from "./datasetPageTabs/DatasetImportTree";
import ImportTimeline from "../DatasetImportMetrics/ImportTimeline";

import DatasetDownload from "../Download";

import DatasetSourceMetrics from "./datasetPageTabs/DatasetSourceMetrics";
import ReleaseSource from "./datasetPageTabs/ReleaseSource";
import NameSearch from "../NameSearch";
import WorkBench from "../WorkBench";

import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import Helmet from "react-helmet";
import Duplicates from "../Duplicates";
import Taxon from "../Taxon";
import Name from "../Name";
import Reference from "../Reference"
import VerbatimRecord from "../VerbatimRecord";
import VerbatimByID from "../VerbatimRecord/VerbatimByID";
import moment from "moment";
class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,
      loading: true,
      importState: null,
      hasData: false,
      lastSuccesFullImport: null,
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { key: datasetKey },
      },
    } = this.props;
    this.getData(datasetKey);
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(this.props, "match.params.key") !==
      _.get(prevProps, "match.params.key")
    ) {
      this.getData(_.get(this.props, "match.params.key"));
    }
  };

  getData = (datasetKey) => {
    Promise.all([
      axios(`${config.dataApi}dataset/${datasetKey}/import`),
      axios(`${config.dataApi}dataset/${datasetKey}/import?state=finished`),
    ])

      .then((res) => {
        const importState = _.get(res[0], "data[0]") || null;
        const hasData = res[1].data.length > 0;
        this.setState({
          importState,
          hasData,
          lastSuccesFullImport: hasData ? _.get(res, "[1].data[0]") : null,
        });
      })
      .catch((err) => {
        this.setState({ importState: null });
      });
  };

  render() {
    //  const { datasetKey, section, dataset } = this.props;
    const { importState, lastSuccesFullImport } = this.state;

    const {
      match: {
        params: { key: datasetKey, section, taxonOrNameKey, catalogueKey, subsection },
      },
      location,
      dataset,
      importStateMap,
      user,
    } = this.props;
    console.log(subsection)
    if (dataset && !section && !_.get(dataset, "deleted")) {
      return (
        <Redirect
          to={{
            pathname: `/dataset/${datasetKey}/about`,
          }}
        />
      );
    }
    if (dataset && !section && _.get(dataset, "deleted")) {
      return (
        <Redirect
          to={{
            pathname: `/dataset/${datasetKey}/about`,
          }}
        />
      );
    }

    const sect = !section ? "about" : section.split("?")[0];
    const openKeys = ["dataset", "datasetKey"];
    const selectedKeys = ["diff", "import-history"].includes(section)
      ? ["imports"]
      : sect === "duplicates" && !taxonOrNameKey ? ["datasetDuplicateSearch"]
      : sect === "duplicates" && taxonOrNameKey ? ["datasetDuplicateTasks"]
      : [section];

    return (
      <Layout
        selectedDataset={dataset}
        selectedCatalogueKey={catalogueKey}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
        taxonOrNameKey={taxonOrNameKey}
      >
        {_.get(dataset, "title") && (
          <Helmet title={`${_.get(dataset, "title")} in COL`} />
        )}
        {dataset && _.get(dataset, "deleted") && (
          <Alert
            style={{ marginTop: "16px" }}
            message={<Row><Col>{`This dataset was deleted ${moment(dataset.deleted).format(
              "LLL"
            )}`}</Col><Col flex="auto"></Col>{dataset.origin === "released" && dataset.sourceKey === 3 && <Col>
            <a href="https://download.checklistbank.org/col/monthly/" target="_blank">Archived releases</a>
            </Col>}</Row>}
            type="error"
          />
        )}
        {importState &&
          _.get(importStateMap[importState.state], "running") === "true" && (
            <Alert
              style={{ marginTop: "16px" }}
              message="The dataset is currently being imported. Data may be inconsistent."
              type="warning"
            />
          )}
        {importState && importState.state === "failed" && (
          <Alert
            style={{ marginTop: "16px" }}
            message={`Last ${_.startCase(
              importState.job
            )} of this dataset failed.`}
            description={importState.error}
            type="error"
          />
        )}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {["release-metrics", "imports"].includes(section) && subsection !== "tree" && (
          <DatasetImportMetrics
            datasetKey={datasetKey}
            origin={_.get(dataset, "origin")}
            match={this.props.match}
            updateImportState={() => this.getData(datasetKey)}
          />
        )}
        {subsection === "tree" && section === "imports" && <DatasetImportTree datasetKey={datasetKey} attempt={taxonOrNameKey}/>}
        {(!section || section === "metadata" || section === "about") && (
          <DatasetMeta id={datasetKey} />
        )}

        {section === "classification" && (
          <DatasetClassification
            dataset={dataset}
            datasetKey={datasetKey}
            location={location}
          />
        )}
        {section === "projects" && (
          <DatasetProjects dataset={dataset} location={location} />
        )}
        {sect === "names" && (
          <NameSearch datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "workbench" && (
          <WorkBench
            datasetKey={datasetKey}
            location={this.props.location}
            catalogueKey={catalogueKey}
          />
        )}
        
        
       {sect === "duplicates" && !taxonOrNameKey && (
          <Duplicates
            datasetKey={datasetKey}
            location={this.props.location}
          />
        )} 
        {sect === "references" && (
          <DatasetReferences
            datasetKey={datasetKey}
            location={this.props.location}
          />
        )}
         {sect === "reference" && (
          <Reference
            datasetKey={datasetKey}
            id={taxonOrNameKey}
          />
        )}
        {sect === "duplicates" && taxonOrNameKey && (
          <DatasetTasks
            datasetKey={datasetKey}
            location={this.props.location}
            assembly={false}
          />
        )}
        {sect === "taxon" && (
          <Taxon
            datasetKey={datasetKey}
            location={this.props.location}
            match={this.props.match}
          />
        )}
        {sect === "name" && (
          <Name
            datasetKey={datasetKey}
            location={this.props.location}
            match={this.props.match}
          />
        )}
        {sect === "verbatim" && !taxonOrNameKey && (
          <VerbatimRecord
            datasetKey={datasetKey}
            lastSuccesFullImport={lastSuccesFullImport}
           /*  location={this.props.location}
            match={this.props.match} */
          />
        )}
        {sect === "verbatim" && taxonOrNameKey && (
        <VerbatimByID
          key={taxonOrNameKey}
          datasetKey={datasetKey}
          verbatimKey={taxonOrNameKey}
          basicHeader={true}
          location={location}
        />
        )}
        {sect === "source" && (
          <ReleaseSource
            datasetKey={datasetKey}
            location={this.props.location}
            match={this.props.match}
          />
        )}
        {sect === "options" && Auth.canEditDataset(dataset, user) && (
          <DatasetOptions datasetKey={datasetKey} />
        )}
        {sect === "sourcemetrics" && (
          <DatasetSourceMetrics datasetKey={datasetKey} />
        )}
        {section === "download" && (
          <DatasetDownload
            downloadKey={taxonOrNameKey}
            dataset={dataset}
            location={location}
          />
        )}
        {section === "diff" && <DatasetDiff datasetKey={datasetKey} />}
        {section === "import-timeline" && (
          <ImportTimeline datasetKey={datasetKey} />
        )}
      </Layout>
    );
  }
}

const mapContextToProps = ({ dataset, importStateMap, user }) => ({
  dataset,
  importStateMap,
  user,
});
export default withContext(mapContextToProps)(DatasetPage);
