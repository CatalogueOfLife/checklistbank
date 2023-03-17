import React from "react";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import Helmet from "react-helmet";
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
import DeleteDatasetButton from "../../DatasetKey/datasetPageTabs/DeleteDatasetButton"
import Auth from "../../../components/Auth";

class CatalogueOptions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      releaseColLoading: false,
      rematchSectorsAndDecisionsLoading: false,
      exportResponse: null,
      data: null,
      editMode: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(this.props, "match.params.catalogueKey") !==
      _.get(prevProps, "match.params.catalogueKey")
    ) {
      this.getData();
    }
  };

  getData = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${catalogueKey}/settings`)
      .then((res) => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: null });
      });
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  };

  rematchSectorsOrDecisions = (type) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/${type}/rematch`, {})
      .then((res) => {
        this.setState({
          rematchSectorsAndDecisionsLoading: false,
          error: null,
          rematchInfo: { [type]: res.data },
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          rematchInfo: null,
          rematchSectorsAndDecisionsLoading: false,
        })
      );
  };

  releaseCatalogue = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ releaseColLoading: true });
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/release`)
      .then((res) => {
        this.setState(
          {
            releaseColLoading: false,
            error: null,
            exportResponse: res.data,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "release selected project (might take long)",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          releaseColLoading: false,
          exportResponse: null,
        })
      );
  };

  xrelease = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    this.setState({ releaseColLoading: true });
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/xrelease`)
      .then((res) => {
        this.setState(
          {
            releaseColLoading: false,
            error: null,
            exportResponse: res.data,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "extended release of selected project (might take long)",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          releaseColLoading: false,
          exportResponse: null,
        })
      );
  };

  recalculateSectorCounts = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios
      .post(
        `${config.dataApi}admin/sector-count-update?datasetKey=${catalogueKey}`
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

  consolidateHomotypicNames = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    axios
      .post(
        `${config.dataApi}dataset/${catalogueKey}/consolidate-homotypic`
      )
      .then(() => {
        notification.open({
          message: "Homotypic grouping",
          description: `Consolidating homotypic names for all families`,
        });
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  }
  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  };

  render() {
    const {
      releaseColLoading,
      rematchSectorsAndDecisionsLoading,
      error,
      data,
      editMode,
    } = this.state;

    const {
      match: {
        params: { catalogueKey },
      },
      catalogue,
      datasetSettings,
      user
    } = this.props;
    return (
      <Layout
        selectedKeys={["catalogueOptions"]}
        openKeys={["assembly"]}
        title={catalogue ? catalogue.title : ""}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>Options</title>
        </Helmet>
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
            <Col flex="auto"></Col>
            {Auth.canEditDataset({ key: catalogueKey }, user) && <>
              <Col span={2}>
                {data && (
                  <Switch
                    checked={editMode}
                    onChange={this.setEditMode}
                    checkedChildren="Cancel"
                    unCheckedChildren="Edit"
                  />
                )}
              </Col>
              <Col span={6}>
                <h3>Actions</h3>
              </Col></>
            }
          </Row>
          <Row>
            <Col span={18}>
              {editMode && (
                <DatasetSettingsForm
                  data={data}
                  datasetKey={catalogueKey}
                  dataset={catalogue}
                  onSaveSuccess={() => {
                    this.setEditMode(false);
                    this.getData();
                  }}
                />
              )}
              {!editMode && data && catalogue && (
                <div style={{ marginRight: "28px" }}>
                  {datasetSettings
                    .filter((s) => s.origin.indexOf(catalogue.origin) > -1)
                    .filter((s) => s.type === "Boolean")
                    .map((s) => (
                      <PresentationItem
                        label={_.startCase(s.name)}
                        key={s.name}
                      >
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
                      <PresentationItem
                        label={_.startCase(s.name)}
                        key={s.name}
                      >
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
                      <PresentationItem
                        label={_.startCase(s.name)}
                        key={s.name}
                      >
                        {_.get(data, s.name)}
                      </PresentationItem>
                    ))}
                </div>
              )}
            </Col>
            {Auth.canEditDataset({ key: catalogueKey }, user) && <Col span={6}>
              <Popconfirm
                placement="rightTop"
                title={`Do you want to release ${catalogue.title}?`}
                onConfirm={this.releaseCatalogue}
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
                onConfirm={this.xrelease}
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
                onConfirm={() => this.rematchSectorsOrDecisions("sectors")}
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
                onConfirm={() => this.rematchSectorsOrDecisions("decisions")}
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

              <SyncAllSectorsButton catalogueKey={catalogueKey}
                onError={(err) => this.setState({ error: err })}>
              </SyncAllSectorsButton>

              <Button
                type="primary"
                onClick={() => this.recalculateSectorCounts()}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Recalculate sector counts
              </Button>
              <Button
                type="primary"
                style={{ marginRight: "10px", marginBottom: "10px" }}
                onClick={() =>
                  this.consolidateHomotypicNames()
                }
              >
                Consolidate Homotypic Names
              </Button>

              <DeleteOrphansButton
                datasetKey={catalogueKey}
                type="name"
                style={{ marginRight: "10px", marginBottom: "10px" }}
              />
              <DeleteOrphansButton
                datasetKey={catalogueKey}
                type="reference"
                style={{ marginRight: "10px", marginBottom: "10px" }}
              />
              {catalogue?.key?.toString() === catalogueKey && (
                <DeleteDatasetButton
                  style={{ marginRight: "10px", marginBottom: "10px" }}
                  record={catalogue}
                ></DeleteDatasetButton>
              )}

            </Col>}
          </Row>
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue, datasetSettings, user }) => ({
  catalogue,
  datasetSettings,
  user
});
export default withContext(mapContextToProps)(withRouter(CatalogueOptions));
