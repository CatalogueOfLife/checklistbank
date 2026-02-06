import React, { useState, useEffect } from "react";
import { Skeleton } from "antd";
import PageContent from "../../../components/PageContent";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import Menu from "../../DatasetImportMetrics/Menu";
import moment from "moment";
import DatasetMeta from "./DatasetMeta";

const DatasetImportMetadata = ({ datasetKey, dataset, attempt, addError }) => {
  const [loading, setLoading] = useState(false);
  const [importDate, setImportDate] = useState(null);
  const [archivedDataset, setArchivedDataset] = useState(null);

  useEffect(() => {
    getData();
  }, [datasetKey, attempt]);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios(
        `${config.dataApi}dataset/${datasetKey}/${attempt}`
      );
      setArchivedDataset(response.data);
      setImportDate(response.data?.issued);
      setLoading(false);
    } catch (error) {
      addError(error);
      setLoading(false);
    }
  };

  return (
    <PageContent>
      <Menu datasetKey={datasetKey} attempt={attempt} dataset={dataset} isFinished={true}/>

      {loading && <Skeleton paragraph={{ rows: 10 }} active />}

      {!loading && archivedDataset && (
        <DatasetMeta
          id={archivedDataset.key}
          isArchived={true}
          archivedData={archivedDataset}
        />
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ addError, dataset }) => ({ addError, dataset });
export default withContext(mapContextToProps)(DatasetImportMetadata);
