import React from "react";
import config from "../../../config";
import { Redirect } from "react-router-dom";
import axios from "axios";
import { Alert } from "antd";

import Layout from "../../../components/LayoutNew";
import DatasetIssues from "./subPages/DatasetIssues";
import DatasetTasks from "./subPages/DatasetTasks";
import DatasetMeta from "../../DatasetKey/datasetPageTabs/DatasetMeta";
import DatasetReferences from "../../DatasetKey/datasetPageTabs/DatasetReferences";
import DatasetClassification from "../../DatasetKey/datasetPageTabs/DatasetClassification";
import DatasetImportMetrics from "../../DatasetImportMetrics";
import WorkBench from "../../WorkBench";
import VerbatimRecord from "../../VerbatimRecord";
import Taxon from "../../Taxon";
import Name from "../../Name";
import withContext from "../../../components/hoc/withContext";

import _ from "lodash";
import Helmet from "react-helmet";
import Duplicates from "../../Duplicates";

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
        params: { key: datasetKey, section, taxonOrNameKey, catalogueKey },
      },
      location,
      dataset,
      importStateMap,
    } = this.props;

    if (dataset && !section && !_.get(dataset, "deleted")) {
      return (
        <Redirect
          to={{
            pathname: `/dataset/${datasetKey}/names`,
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

    const sect = !section ? "meta" : section.split("?")[0];
    const openKeys = ["assembly", "sourceDataset"];
    const selectedKeys = [`source_${section}`];
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
            message={`This dataset was deleted ${moment(dataset.deleted).format(
              "LLL"
            )}`}
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
            type="error"
          />
        )}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {sect === "workbench" && (
          <WorkBench
            datasetKey={datasetKey}
            location={this.props.location}
            catalogueKey={catalogueKey}
          />
        )}{" "}
        {/* catalogueKeys are used to scope decisions and tasks */}
        {sect === "duplicates" && (
          <Duplicates
            datasetKey={datasetKey}
            location={this.props.location}
            catalogueKey={catalogueKey}
          />
        )}
        {sect === "tasks" && (
          <DatasetTasks
            datasetKey={datasetKey}
            location={this.props.location}
            catalogueKey={catalogueKey}
          />
        )}
        {!section ||
          (section === "meta" && (
            <DatasetMeta id={datasetKey} catalogueKey={catalogueKey} />
          ))}
        {section === "classification" && (
          <DatasetClassification dataset={dataset} location={location} />
        )}
        {sect === "references" && (
          <DatasetReferences
            datasetKey={datasetKey}
            location={this.props.location}
          />
        )}
        {sect === "verbatim" && (
          <VerbatimRecord
            datasetKey={datasetKey}
            lastSuccesFullImport={lastSuccesFullImport}
            location={this.props.location}
            match={this.props.match}
          />
        )}
        {section === "imports" && (
          <DatasetImportMetrics
            datasetKey={datasetKey}
            origin={_.get(dataset, "origin")}
            match={this.props.match}
            updateImportState={() => this.getData(datasetKey)}
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
      </Layout>
    );
  }
}

const mapContextToProps = ({ dataset, importStateMap }) => ({
  dataset,
  importStateMap,
});
export default withContext(mapContextToProps)(DatasetPage);
