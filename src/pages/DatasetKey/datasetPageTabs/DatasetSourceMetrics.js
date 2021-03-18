import React from "react";
import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";

import { Row, Alert, notification } from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import SourceMetrics from "../../catalogue/CatalogueSourceMetrics/SourceMetrics";

class DatasetSourceMetrics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      data: null,
      editMode: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = (prevProps) => {
    if (_.get(this.props, "datasetKey") !== _.get(prevProps, "datasetKey")) {
      this.getData();
    }
  };

  getData = () => {
    const { datasetKey } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}/settings`)
      .then((res) => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: null });
      });
  };

  reindexDataset = () => {
    const { datasetKey } = this.props;
    axios
      .post(`${config.dataApi}admin/reindex`, { datasetKey })
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Process started",
            description: `Dataset ${datasetKey} is being reindexed`,
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  };

  render() {
    const { error } = this.state;

    const { dataset } = this.props;
    return (
      <PageContent>
        {error && (
          <Row>
            <Alert
              closable
              onClose={() => this.setState({ error: null })}
              message={<ErrorMsg error={error} />}
              type="error"
            />
          </Row>
        )}
        <SourceMetrics
          catalogueKey={dataset.sourceKey}
          datasetKey={dataset.key}
          namesPath={`/dataset/${dataset.key}/names`}
          omitList={[dataset.key]}
        />
      </PageContent>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetSourceMetrics));
