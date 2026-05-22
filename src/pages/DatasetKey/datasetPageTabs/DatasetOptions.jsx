import { useState, useEffect } from "react";
import React from "react";
import withRouter from "../../../withRouter";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";

import { Row, Col, Alert, Switch, Button, App } from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import BooleanValue from "../../../components/BooleanValue";
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";
import DeleteOrphansButton from "../../project/Options/DeleteOrphansButton";
import ImportButton from "../../Imports/importTabs/ImportButton";
import DeleteDatasetButton from "./DeleteDatasetButton";

const DatasetSettings = ({ datasetKey, datasetSettings, dataset }) => {
  const { notification } = App.useApp();
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [editMode, setEditModeState] = useState(false);
  const [rebuildMatcherLoading, setRebuildMatcherLoading] = useState(false);

  const getData = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/settings`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData(null);
      });
  };

  useEffect(() => {
    getData();
  }, [datasetKey]);

  const reindexDataset = () => {
    axios
      .post(`${config.dataApi}admin/reindex?datasetKey=${datasetKey}`)
      .then(() => {
        setError(null);
        notification.open({
          message: "Process started",
          description: `Dataset ${datasetKey} is being reindexed`,
        });
      })
      .catch((err) => setError(err));
  };

  const rebuildMatcher = () => {
    setRebuildMatcherLoading(true);
    setError(null);
    axios
      .delete(`${config.dataApi}matcher/${datasetKey}`)
      .then(() => axios.post(`${config.dataApi}matcher/${datasetKey}`))
      .then(() => {
        setRebuildMatcherLoading(false);
        notification.open({
          message: "Matcher rebuild started",
          description: `Matcher index for dataset ${datasetKey} is being rebuilt`,
        });
      })
      .catch((err) => {
        setRebuildMatcherLoading(false);
        setError(err);
      });
  };

  const setEditMode = (checked) => {
    setEditModeState(checked);
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

      <Row>
        <Col span={4}>
          <h3>Settings</h3>
        </Col>
        <Col offset={12} span={2}>
          {data && (
            <Switch
              checked={editMode}
              onChange={setEditMode}
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
                setEditMode(false);
                getData();
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
            onClick={reindexDataset}
            style={{
              marginRight: "10px",
              marginBottom: "10px",
            }}
          >
            Reindex dataset
          </Button>

          <Button
            type="primary"
            onClick={rebuildMatcher}
            loading={rebuildMatcherLoading}
            style={{
              marginRight: "10px",
              marginBottom: "10px",
            }}
          >
            Rebuild matcher
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
};

const mapContextToProps = ({ datasetSettings, dataset }) => ({
  datasetSettings,
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetSettings));
