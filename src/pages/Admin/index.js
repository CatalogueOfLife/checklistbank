import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Form,
  Switch,
  Button,
  Alert,
  Popconfirm,
  notification
} from "antd";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";
const { MANAGEMENT_CLASSIFICATION } = config;
const FormItem = Form.Item;
class AdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      allSectorSyncloading: false,
      releaseColLoading: false,
      updateAllLogosloading: false,
      recalculateSectorCountsLoading: false,
      rematchSectorsAndDecisionsLoading: false,
      exportResponse: null,
      background: {},
      backgroundError: null,
      datasetKey: null
    };
  }

  componentDidMount = () => {
    this.getBackground();
  };
  getBackground = () => {
    axios
      .get(`${config.dataApi}admin/background`)
      .then(res => {
        this.setState({ background: res.data, backgroundError: null });
      })
      .catch(err => this.setState({ backgroundError: err }));
  };

  updateBackground = (param, checked) => {
    const { background } = this.state;
    axios
      .put(`${config.dataApi}admin/background`, {
        ...background,
        [param]: checked
      })
      .then(() => {
        this.setState({
          background: { ...background, [param]: checked },
          backgroundError: null
        });
      })
      .catch(err => this.setState({ backgroundError: err }));
  };

  syncAllSectors = () => {
    this.setState({ allSectorSyncloading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync`, {all: true}
      )
      .then(res => {
        this.setState(
          { allSectorSyncloading: false, error: null, exportResponse: null },
          () => {
            notification.open({
              message: "Action triggered",
              description: "All sectors syncing"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          allSectorSyncloading: false,
          exportResponse: null
        })
      );
  };

  releaseCoL = () => {
    this.setState({ releaseColLoading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/release`
      )
      .then(res => {
        this.setState(
          {
            releaseColLoading: false,
            error: null,
            exportResponse: res.data
          },
          () => {
            notification.open({
              message: "Action triggered",
              description:
                "release CoL draft to old portal synchroneously (might take long)"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          releaseColLoading: false,
          exportResponse: null
        })
      );
  };

  updateAllLogos = () => {
    this.setState({ updateAllLogosloading: true });
    axios
      .post(`${config.dataApi}admin/logo-update`)
      .then(res => {
        this.setState(
          { updateAllLogosloading: false, error: null, exportResponse: null },
          () => {
            notification.open({
              message: "Action triggered",
              description: "updating all logos async"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          updateAllLogosloading: false,
          exportResponse: null
        })
      );
  };

  recalculateSectorCounts = () => {
    this.setState({ recalculateSectorCountsLoading: true });
    axios
      .post(`${config.dataApi}admin/sector-count-update`)
      .then(res => {
        this.setState(
          {
            recalculateSectorCountsLoading: false,
            error: null,
            exportResponse: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "recalculating sector counts"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          recalculateSectorCountsLoading: false,
          exportResponse: null
        })
      );
  };
  
  rematchSectorsAndDecisions = () => {
    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/rematch`,
        { all: true }
      )
      .then(res => {
        this.setState(
          {
            rematchSectorsAndDecisionsLoading: false,
            error: null,
            exportResponse: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "rematching all broken sectors and decisions"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          rematchSectorsAndDecisionsLoading: false,
          exportResponse: null
        })
      );
  };

  rematchAllSectorsDecisionsAndEstimates = () =>{
    this.setState({ rematchAllSectorsDecisionsAndEstimatesLoading: true });
    axios
      .post(
        `${config.dataApi}admin/rematch`,
        { all: true }
      )
      .then(res => {
        this.setState(
          {
            rematchAllSectorsDecisionsAndEstimatesLoading: false,
            error: null,
            exportResponse: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "rematching all sectors, decisions and estimates"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          rematchAllSectorsDecisionsAndEstimatesLoading: false,
          exportResponse: null
        })
      );
  }

  reindexAllDatasets = () =>{
    this.setState({ reindexAllDatasetsLoading: true });
    axios
      .post(
        `${config.dataApi}admin/reindex`,
        { all: true }
      )
      .then(res => {
        this.setState(
          {
            reindexAllDatasetsLoading: false,
            error: null,
            exportResponse: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "reindexing all datasets"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          reindexAllDatasetsLoading: false,
          exportResponse: null
        })
      );
  }

  onSelectDataset = dataset => {
    this.setState({
      dataset: dataset
    });
  };

  reindexDataset = dataset => {
    axios
      .post(`${config.dataApi}admin/reindex`, { datasetKey: dataset.key })
      .then(res => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Process started",
            description: `${dataset.title} is being reindexed`
          });
        });
      })
      .catch(err => this.setState({ error: err }));
  };

  rematchDataset = dataset => {
    axios
      .post(`${config.dataApi}admin/rematch`, { datasetKey: dataset.key })
      .then(res => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Process started",
            description: `${dataset.title} is being rematched`
          });
        });
      })
      .catch(err => this.setState({ error: err }));
  };

  exportDataset = dataset => {
    axios
      .post(`${config.dataApi}assembly/${dataset.key}/export`)
      .then(res => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Process started",
            description: `${dataset.title} is being exported`
          });
        });
      })
      .catch(err => this.setState({ error: err }));
  };

  render() {
    const {
      allSectorSyncloading,
      releaseColLoading,
      updateAllLogosloading,
      recalculateSectorCountsLoading,
      rematchSectorsAndDecisionsLoading,
      rematchAllSectorsDecisionsAndEstimatesLoading,
      reindexAllDatasetsLoading,
      exportResponse,
      error,
      background,
      dataset
    } = this.state;

    return (
      <Layout openKeys={[]} selectedKeys={["admin"]} title="CoL+ Admin">
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Admin</title>
          <link rel="canonical" href="http://data.catalogue.life" />
        </Helmet>
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
          <Row>
            <Form layout="inline">
              <FormItem label="Background GBIF Sync">
                <Switch
                  onChange={checked => {
                    this.updateBackground("gbifSync", checked);
                  }}
                  checked={background.gbifSync}
                />
              </FormItem>
              <FormItem label="Background importer">
                <Switch
                  onChange={checked => {
                    this.updateBackground("importer", checked);
                  }}
                  checked={background.importer}
                />
              </FormItem>
            </Form>
          </Row>

          <Popconfirm
            placement="rightTop"
            title="Sync all sectors?"
            onConfirm={this.syncAllSectors}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={allSectorSyncloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Sync all sectors
            </Button>
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Do you want to export the draft to the old portal?"
            onConfirm={this.releaseCoL}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={releaseColLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Release CoL draft
            </Button>
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Update all logos?"
            onConfirm={this.updateAllLogos}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={updateAllLogosloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Update all logos
            </Button>
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Recalculate sector counts?"
            onConfirm={this.recalculateSectorCounts}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={recalculateSectorCountsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Recalculate sector counts
            </Button>
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Do you want to rematch all broken sectors and decisions?"
            onConfirm={this.rematchSectorsAndDecisions}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={rematchSectorsAndDecisionsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Rematch all broken sectors and decisions
            </Button>
            
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Do you want to rematch all sectors, decisions & estimates?"
            onConfirm={this.rematchAllSectorsDecisionsAndEstimates}
            okText="Yes"
            cancelText="No"
          >
          <Button
              type="primary"
              loading={rematchAllSectorsDecisionsAndEstimatesLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Rematch all sectors, decisions & estimates
            </Button>
            </Popconfirm>

            <Popconfirm
            placement="rightTop"
            title="Do you want to reindex all datasets?"
            onConfirm={this.reindexAllDatasets}
            okText="Yes"
            cancelText="No"
          >
          <Button
              type="primary"
              loading={reindexAllDatasetsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Reindex all datasets
            </Button>
            </Popconfirm>
      

          <Row>
            <Col span={12}>
              <DatasetAutocomplete onSelectDataset={this.onSelectDataset} onResetSearch={() => this.setState({dataset: null})} />
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                onClick={() => this.reindexDataset(dataset)}
                style={{ marginLeft: "10px", marginRight: "10px", marginBottom: "10px" }}
                disabled={!dataset}
              >
                Re-index selected dataset
              </Button>
              <Button
                type="primary"
                onClick={() => this.rematchDataset(dataset)}
                style={{ marginRight: "10px", marginBottom: "10px" }}
                disabled={!dataset}
              >
                Rematch selected dataset
              </Button>
              <Button
                type="primary"
                onClick={() => this.exportDataset(dataset)}
                style={{ marginRight: "10px", marginBottom: "10px" }}
                disabled={!dataset}
              >
                Export selected dataset
              </Button>
            </Col>
          </Row>
          <Row>
            <a href={config.downloadApi}>Downloads</a>
          </Row>
          <Row>
              <a href={`${config.dataApi}monitor/healthcheck`}>Health</a> - 
              <a href={`${config.dataApi}monitor/threads`}>Threads</a> - 
              <a href={`${config.dataApi}monitor/metrics`}>Metrics</a> - 
              <a href={`${config.dataApi}monitor/pprof`}>CPU Profile</a> - 
              <a href={`${config.dataApi}monitor/pprof?state=blocked`}>CPU Blocked</a>              
          </Row>

          <Row>
            {exportResponse && (
              <div>
                The export is available{" "}
                <a href={`${config.downloadApi}`}>here</a>
                <pre>{exportResponse}</pre>
              </div>
            )}
          </Row>
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(AdminPage);
