import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Switch,
  Badge,
  Button,
  Alert,
  Popconfirm,
  notification,
  Form,
} from "antd";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";

const FormItem = Form.Item;

class AdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      updateAllLogosloading: false,
      updateAllMetricsloading: false,
      recalculateSectorCountsLoading: false,
      background: {},
      backgroundError: null,
    };
  }

  componentDidMount = () => {
    this.props.getBackground();
  };

  updateBackground = (param, checked) => {
    const { background, getBackground } = this.props;
    axios
      .put(`${config.dataApi}admin/settings`, {
        ...background,
        [param]: checked,
      })
      .then(getBackground);
  };

  updateAllLogos = () => {
    this.setState({ updateAllLogosloading: true });
    axios
      .post(`${config.dataApi}admin/logo-update`)
      .then((res) => {
        this.setState({ updateAllLogosloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "updating all logos async",
          });
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          updateAllLogosloading: false,
        })
      );
  };

  updateAllMetrics = () => {
    this.setState({ updateAllMetricsloading: true });
    axios
      .post(`${config.dataApi}admin/metrics-update`)
      .then((res) => {
        this.setState({ updateAllMetricsloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "updating all metrics async",
          });
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          updateAllMetricsloading: false,
        })
      );
  };

  updateUsageCounts = () => {
    this.setState({ updateUsageCountsLoading: true });
    axios
      .post(`${config.dataApi}admin/counter-update`)
      .then((res) => {
        this.setState({ updateUsageCountsLoading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "updating all managed usage counts",
          });
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          updateUsageCountsLoading: false,
        })
      );
  };

  recalculateSectorCounts = () => {
    this.setState({ recalculateSectorCountsLoading: true });
    axios
      .post(`${config.dataApi}admin/sector-count-update`)
      .then((res) => {
        this.setState(
          {
            recalculateSectorCountsLoading: false,
            error: null,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "recalculating sector counts",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          recalculateSectorCountsLoading: false,
        })
      );
  };

  reindexAllDatasets = () => {
    this.setState({ reindexAllDatasetsLoading: true });
    axios
      .post(`${config.dataApi}admin/reindex`, { all: true })
      .then((res) => {
        this.setState(
          {
            reindexAllDatasetsLoading: false,
            error: null,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "reindexing all datasets",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          reindexAllDatasetsLoading: false,
        })
      );
  };

  restartImporter = () => {
    axios
      .post(`${config.dataApi}importer/restart`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Importer restarted",
          });
        });
      })
      .catch((err) => this.setState({ error: err }));
  };

  render() {
    const {
      updateAllLogosloading,
      updateAllMetricsloading,
      updateUsageCountsLoading,
      recalculateSectorCountsLoading,
      reindexAllDatasetsLoading,
      error,
    } = this.state;

    const { background } = this.props;
    return (
      <Layout
        openKeys={["admin"]}
        selectedKeys={["adminSettings"]}
        title="COL Admin"
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>COL Admin</title>
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
            <FormItem label="Background jobs">
              {background.idle && (
                <Badge count={"idle"} style={{ backgroundColor: '#52c41a' }} />
              )}
              {background.idle || (
                <Badge count={"active"} style={{ backgroundColor: 'red' }} />
              )}
            </FormItem>
          </Row>

          <Row>
            <Col span={24}>
              <Form layout="inline">
                <FormItem label="GBIF Registry Sync">
                  <Switch
                    onChange={(checked) => {
                      this.updateBackground("gbifSync", checked);
                    }}
                    checked={background.gbifSync}
                  />
                </FormItem>
                <FormItem label="Dataset importer">
                  <Switch
                    onChange={(checked) => {
                      this.updateBackground("importer", checked);
                    }}
                    checked={background.importer}
                  />
                </FormItem>
                <FormItem label="Import scheduler">
                  <Switch
                    onChange={(checked) => {
                      this.updateBackground("scheduler", checked);
                    }}
                    checked={background.scheduler}
                  />
                </FormItem>
                <FormItem label="Maintenance">
                  <Switch
                    onChange={(checked) => {
                      this.updateBackground("maintenance", checked);
                    }}
                    checked={background.maintenance}
                  />
                </FormItem>
              </Form>
            </Col>
          </Row>

          <Row>
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
              title="Update all metrics?"
              onConfirm={this.updateAllMetrics}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={updateAllMetricsloading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Update all metrics
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Update usage counts?"
              onConfirm={this.updateUsageCounts}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={updateUsageCountsLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Update usage counts
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Update sector counts?"
              onConfirm={this.recalculateSectorCounts}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={recalculateSectorCountsLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Update sector counts
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

            <Popconfirm
              placement="rightTop"
              title="Do you want to restart the importer?"
              onConfirm={this.restartImporter}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Restart importer
              </Button>
            </Popconfirm>
          </Row>

          <Row>
            <a href={config.downloadApi}>Downloads</a>
          </Row>
          <Row>
            <a href={`${config.dataApi}monitor/healthcheck`}>Health</a> -
            <a href={`${config.dataApi}monitor/threads`}>Threads</a> -
            <a href={`${config.dataApi}monitor/metrics`}>Metrics</a> -
            <a href={`${config.dataApi}monitor/pprof`}>CPU Profile</a> -
            <a href={`${config.dataApi}monitor/pprof?state=blocked`}>
              CPU Blocked
            </a>
          </Row>
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({
  catalogueKey,
  catalogue,
  setCatalogue,
  getBackground,
  background,
}) => ({
  catalogueKey,
  catalogue,
  setCatalogue,
  getBackground,
  background,
});
export default withContext(mapContextToProps)(AdminPage);
