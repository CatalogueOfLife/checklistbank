import { useEffect, useState } from "react";
import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import { Helmet } from "react-helmet-async";
import {
  Row,
  Col,
  Button,
  Alert,
  Popconfirm,
  Switch,
  notification,
} from "antd";
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton";
import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import BooleanValue from "../../../components/BooleanValue";
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";
import DeleteOrphansButton from "./DeleteOrphansButton";
import DeleteDatasetButton from "../../DatasetKey/datasetPageTabs/DeleteDatasetButton";
import Auth from "../../../components/Auth";

const ProjectOptions = ({
  match,
  catalogue,
  datasetSettings,
  user,
}) => {
  const projectKey = _.get(match, "params.projectKey");

  const [error, setError] = useState(null);
  const [releaseColLoading, setReleaseColLoading] = useState(false);
  const [rematchSectorsAndDecisionsLoading, setRematchSectorsAndDecisionsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const getData = () => {
    axios(`${config.dataApi}dataset/${projectKey}/settings`)
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
  }, [projectKey]);

  const rematchSectorsOrDecisions = (type) => {
    setRematchSectorsAndDecisionsLoading(true);
    axios
      .post(`${config.dataApi}dataset/${projectKey}/${type}/rematch`, {})
      .then((res) => {
        setRematchSectorsAndDecisionsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setRematchSectorsAndDecisionsLoading(false);
      });
  };

  const validateProject = () => {
    setReleaseColLoading(true);
    axios
      .post(`${config.dataApi}dataset/${projectKey}/validate`)
      .then((res) => {
        setReleaseColLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "validate selected project (might take a while)",
        });
      })
      .catch((err) => {
        setError(err);
        setReleaseColLoading(false);
      });
  };

  const releaseCatalogue = () => {
    setReleaseColLoading(true);
    axios
      .post(`${config.dataApi}dataset/${projectKey}/release`)
      .then((res) => {
        setReleaseColLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "release selected project (might take long)",
        });
      })
      .catch((err) => {
        setError(err);
        setReleaseColLoading(false);
      });
  };

  const xrelease = () => {
    setReleaseColLoading(true);
    axios
      .post(`${config.dataApi}dataset/${projectKey}/xrelease`)
      .then((res) => {
        setReleaseColLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description:
            "extended release of selected project (might take long)",
        });
      })
      .catch((err) => {
        setError(err);
        setReleaseColLoading(false);
      });
  };

  const recalculateSectorCounts = () => {
    axios
      .post(
        `${config.dataApi}admin/sector-count-update?datasetKey=${projectKey}`
      )
      .then((res) => {
        notification.open({
          message: `Recalculating sector counts`,
        });
      })
      .catch((err) => {
        notification.error({
          message: "Error",
          description: <ErrorMsg error={err} />,
        });
      });
  };

  const consolidateHomotypicNames = () => {
    axios
      .post(`${config.dataApi}dataset/${projectKey}/consolidate-homotypic`)
      .then(() => {
        notification.open({
          message: "Homotypic grouping",
          description: `Consolidating homotypic names for all families`,
        });
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <>
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
        <Col flex="auto"></Col>
        {Auth.canEditDataset({ key: projectKey }, user) && (
          <>
            <Col span={2}>
              {data && (
                <Switch
                  checked={editMode}
                  onChange={setEditMode}
                  checkedChildren="Cancel"
                  unCheckedChildren="Edit"
                />
              )}
            </Col>
            <Col span={6}>
              <h3>Actions</h3>
            </Col>
          </>
        )}
      </Row>
      <Row>
        <Col span={18}>
          {editMode && (
            <DatasetSettingsForm
              data={data}
              datasetKey={projectKey}
              dataset={catalogue}
              onSaveSuccess={() => {
                setEditMode(false);
                getData();
              }}
            />
          )}
          {!editMode && data && catalogue && (
            <div style={{ marginRight: "28px" }}>
              {datasetSettings
                .filter((s) => s.origin.indexOf(catalogue.origin) > -1)
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
                .filter((s) => s.origin.indexOf(catalogue.origin) > -1)
                .filter((s) => s.type === "String" || s.type === "Integer")
                .map((s) => (
                  <PresentationItem label={_.startCase(s.name)} key={s.name}>
                    {_.get(data, s.name) === "\t"
                      ? "<TAB>"
                      : _.get(data, s.name)}
                  </PresentationItem>
                ))}
              {datasetSettings
                .filter((s) => s.origin.indexOf(catalogue.origin) > -1)
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
        {Auth.canEditDataset({ key: projectKey }, user) && (
          <Col span={6}>
            <Popconfirm
              placement="rightTop"
              title={`Do you want to validate ${catalogue.title}? All issues will be rebuild.`}
              onConfirm={validateProject}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={releaseColLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Validate
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title={`Do you want to release ${catalogue.title}?`}
              onConfirm={releaseCatalogue}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={releaseColLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Release
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title={`Do you want to create an extended release of ${catalogue.title}?`}
              onConfirm={xrelease}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={releaseColLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Extended release
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Do you want to rematch all sectors?"
              onConfirm={() => rematchSectorsOrDecisions("sectors")}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={rematchSectorsAndDecisionsLoading}
                style={{ marginBottom: "10px" }}
              >
                Rematch all sectors
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Do you want to rematch all decisions?"
              onConfirm={() => rematchSectorsOrDecisions("decisions")}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={rematchSectorsAndDecisionsLoading}
                style={{ marginBottom: "10px" }}
              >
                Rematch all decisions
              </Button>
            </Popconfirm>

            <SyncAllSectorsButton
              projectKey={projectKey}
              onError={(err) => setError(err)}
            ></SyncAllSectorsButton>

            <Button
              type="primary"
              onClick={() => recalculateSectorCounts()}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Recalculate sector counts
            </Button>
            <Button
              type="primary"
              style={{ marginRight: "10px", marginBottom: "10px" }}
              onClick={() => consolidateHomotypicNames()}
            >
              Consolidate Homotypic Names
            </Button>

            <DeleteOrphansButton
              datasetKey={projectKey}
              type="name"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            />
            <DeleteOrphansButton
              datasetKey={projectKey}
              type="reference"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            />
            {catalogue?.key?.toString() === projectKey && (
              <DeleteDatasetButton
                style={{ marginRight: "10px", marginBottom: "10px" }}
                record={catalogue}
              ></DeleteDatasetButton>
            )}
          </Col>
        )}
      </Row>
    </>
  );
};

const mapContextToProps = ({ catalogue, datasetSettings, user }) => ({
  catalogue,
  datasetSettings,
  user,
});
export default withContext(mapContextToProps)(withRouter(ProjectOptions));
