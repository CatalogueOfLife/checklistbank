import { useState, useEffect } from "react";
import config from "../../../config";
import { Navigate } from "react-router-dom";
import withRouter from "../../../withRouter";
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
import { Helmet } from "react-helmet-async";
import Duplicates from "../../Duplicates";

import moment from "dayjs";

const DatasetPage = (props) => {
  const {
    match: {
      params: { sourceKey: datasetKey, section, taxonOrNameKey, projectKey },
    },
    location,
    sourceDataset,
    importStateMap,
  } = props;

  const [importState, setImportState] = useState(null);
  const [lastSuccesFullImport, setLastSuccesFullImport] = useState(null);

  const getData = (key) => {
    Promise.all([
      axios(`${config.dataApi}dataset/${key}/import`),
      axios(`${config.dataApi}dataset/${key}/import?state=finished`),
    ])
      .then((res) => {
        const state = _.get(res[0], "data[0]") || null;
        const hasData = res[1].data.length > 0;
        setImportState(state);
        setLastSuccesFullImport(hasData ? _.get(res, "[1].data[0]") : null);
      })
      .catch(() => {
        setImportState(null);
      });
  };

  useEffect(() => {
    getData(datasetKey);
  }, [datasetKey]);

  const dataset = sourceDataset;
  if (dataset && !section && !_.get(dataset, "deleted")) {
    return <Navigate to={`/dataset/${datasetKey}/names`} replace />;
  }
  if (dataset && !section && _.get(dataset, "deleted")) {
    return <Navigate to={`/dataset/${datasetKey}/metadata`} replace />;
  }

  const sect = !section ? "metadata" : section.split("?")[0];
  const openKeys = ["assembly", "sourceDataset"];
  const selectedKeys = [`source_${section}`];
  return (
    <Layout
      selectedDataset={dataset}
      selectedCatalogueKey={projectKey}
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
          title={`This dataset was deleted ${moment(dataset.deleted).format(
            "LLL"
          )}`}
          type="error"
        />
      )}
      {importState &&
        _.get(importStateMap[importState.state], "running") === "true" && (
          <Alert
            style={{ marginTop: "16px" }}
            title="The dataset is currently being imported. Data may be inconsistent."
            type="warning"
          />
        )}
      {importState && importState.state === "failed" && (
        <Alert
          style={{ marginTop: "16px" }}
          title={`Last ${_.startCase(
            importState.job
          )} of this dataset failed.`}
          type="error"
        />
      )}
      {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
      {sect === "workbench" && (
        <WorkBench
          datasetKey={datasetKey}
          location={props.location}
          projectKey={projectKey}
        />
      )}{" "}
      {/* projectKeys are used to scope decisions and tasks */}
      {sect === "duplicates" && (
        <Duplicates
          datasetKey={datasetKey}
          location={props.location}
          projectKey={projectKey}
        />
      )}
      {sect === "tasks" && (
        <DatasetTasks
          datasetKey={datasetKey}
          location={props.location}
          projectKey={projectKey}
        />
      )}
      {!section ||
        (section === "metadata" && (
          <DatasetMeta isSourceInCatalogueView={true} id={datasetKey} projectKey={projectKey} />
        ))}
      {section === "classification" && (
        <DatasetClassification dataset={dataset} location={location} />
      )}
      {sect === "references" && (
        <DatasetReferences
          datasetKey={datasetKey}
          location={props.location}
        />
      )}
      {sect === "verbatim" && (
        <VerbatimRecord
          datasetKey={datasetKey}
          lastSuccesFullImport={lastSuccesFullImport}
          location={props.location}
          match={props.match}
        />
      )}
      {section === "imports" && (
        <DatasetImportMetrics
          datasetKey={datasetKey}
          origin={_.get(dataset, "origin")}
          match={props.match}
          updateImportState={() => getData(datasetKey)}
        />
      )}
      {sect === "taxon" && (
        <Taxon
          datasetKey={datasetKey}
          location={props.location}
          match={props.match}
        />
      )}
      {sect === "name" && (
        <Name
          datasetKey={datasetKey}
          location={props.location}
          match={props.match}
        />
      )}
    </Layout>
  );
};

const mapContextToProps = ({ sourceDataset, importStateMap }) => ({
  sourceDataset,
  importStateMap,
});
export default withRouter(withContext(mapContextToProps)(DatasetPage));
