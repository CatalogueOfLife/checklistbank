import { useState, useEffect } from "react";
import withRouter from "../../../withRouter";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";

import { Row, Alert, notification } from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import SourceMetrics from "../../project/ProjectSourceMetrics/SourceMetrics";

const DatasetSourceMetrics = ({ datasetKey, dataset }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    getData();
  }, [datasetKey]);

  const getData = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/settings`)
      .then((res) => {
        setError(null);
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <PageContent>
      {error && (
        <Row>
          <Alert
            closable={{ onClose: () => setError(null) }}
            description={<ErrorMsg error={error} />}
            type="error"
          />
        </Row>
      )}
      <SourceMetrics
        isProject={false}
        projectKey={
          ["xrelease", "release"].includes(dataset?.origin)
            ? dataset?.sourceKey
            : dataset?.key
        }
        origin={dataset?.origin}
        datasetKey={dataset?.key}
        basePath={`/dataset/${dataset?.key}`}
        omitList={[dataset?.key]}
      />
    </PageContent>
  );
};

const mapContextToProps = ({ dataset }) => ({
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetSourceMetrics));
