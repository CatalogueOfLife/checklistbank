import { useState, useEffect } from "react";
import withRouter from "../../../withRouter";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";

import { Row, Alert } from "antd";

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
      {/* Keys come from the route, not from the context dataset: that is only
          the simple record and is null until it matches this URL, which would
          otherwise build `/dataset/undefined`. `origin` and `sourceKey` are
          read off it because there is nowhere else to get them. */}
      <SourceMetrics
        isProject={false}
        projectKey={
          ["xrelease", "release"].includes(dataset?.origin)
            ? dataset?.sourceKey
            : datasetKey
        }
        origin={dataset?.origin}
        datasetKey={datasetKey}
        basePath={`/dataset/${datasetKey}`}
        omitList={[datasetKey]}
      />
    </PageContent>
  );
};

const mapContextToProps = ({ dataset }) => ({
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetSourceMetrics));
