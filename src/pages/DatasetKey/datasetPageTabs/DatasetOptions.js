import React from "react";
import { withRouter } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";

import { Row, Col, Alert, Switch, Button, notification } from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import BooleanValue from "../../../components/BooleanValue";
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";
import DeleteOrphansButton from "../../catalogue/Options/DeleteOrphansButton";
import ImportButton from "../../Imports/importTabs/ImportButton";
import DeleteDatasetButton from "./DeleteDatasetButton";

class DatasetSettings extends React.Component {
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
      .post(`${config.dataApi}admin/reindex?datasetKey=${datasetKey}`)
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
    const { error, data, editMode } = this.state;

    const { datasetSettings, datasetKey, dataset } = this.props;
    return (
      <PageContent>
        {error && (
          <Row>
            <Alert
              closable
              onClose={() => this.setState({ error: null })}
              description={<ErrorMsg error={error} />}
              type="error"
            />
          </Row>
        )}

        <Row>
          <Col span={4}>
            <h3>Settings</h3>
          </Col>
          <Col offset={12} span={2}>
            {data && (
              <Switch
                checked={editMode}
                onChange={this.setEditMode}
                checkedChildren="Cancel"
                unCheckedChildren="Edit"
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col span={18}>
            {editMode && (
              <DatasetSettingsForm
                data={data}
                datasetKey={datasetKey}
                dataset={dataset}
                onSaveSuccess={() => {
                  this.setEditMode(false);
                  this.getData();
                }}
              />
            )}
            {!editMode && data && dataset && (
              <div style={{ marginRight: "28px" }}>
                {datasetSettings
                  .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset.origin) > -1)
                  .filter((s) => s.type === "Boolean")
                  .map((s) => (
                    <PresentationItem label={_.startCase(s.name)} key={s.name}>
                      {_.get(data, s.name) === true ||
                        _.get(data, s.name) === false ? (
                        <BooleanValue
                          value={_.get(data, s.name)}
                        ></BooleanValue>
                      ) : (
                        ""
                      )}
                    </PresentationItem>
                  ))}
                {datasetSettings
                  .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset.origin) > -1)
                  .filter((s) => s.type === "String" || s.type === "Integer")
                  .map((s) => (
                    <PresentationItem label={_.startCase(s.name)} key={s.name}>
                      {_.get(data, s.name) === "\t"
                        ? "<TAB>"
                        : _.get(data, s.name)}
                    </PresentationItem>
                  ))}
                {datasetSettings
                  .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset.origin) > -1)
                  .filter(
                    (s) => !["String", "Integer", "Boolean"].includes(s.type)
                  )
                  .map((s) => (
                    <PresentationItem label={_.startCase(s.name)} key={s.name}>
                      {_.get(data, s.name)}
                    </PresentationItem>
                  ))}
              </div>
            )}
          </Col>
          <Col span={6}>
            {dataset && _.get(dataset, "origin") !== "project" && (
              <React.Fragment>
                <ImportButton
                  style={{ marginBottom: "10px" }}
                  record={{ datasetKey: dataset.key }}
                  reImport={data && !(data['data access'])}
                />
                <br />
              </React.Fragment>
            )}
            <Button
              type="primary"
              onClick={this.reindexDataset}
              style={{
                marginRight: "10px",
                marginBottom: "10px",
              }}
            >
              Reindex dataset
            </Button>

            <DeleteOrphansButton
              datasetKey={datasetKey}
              type="name"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            />
            <DeleteOrphansButton
              datasetKey={datasetKey}
              type="reference"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            />

            {dataset && !dataset.deleted && (
              <React.Fragment>
                <br />
                <DeleteDatasetButton
                  style={{ marginBottom: "10px" }}
                  record={dataset}
                ></DeleteDatasetButton>
              </React.Fragment>
            )}
          </Col>
        </Row>
      </PageContent>
    );
  }
}

const mapContextToProps = ({ datasetSettings, dataset }) => ({
  datasetSettings,
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetSettings));
