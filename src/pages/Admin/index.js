import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import BackgroundProvider from "../../components/hoc/BackgroundProvider";
import config from "../../config";
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Space,
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
      reindexSchedulerLoading: false,
      rematchSchedulerLoading: false,
      components: { foo: true, bar: false },
      componentsError: null,
      componentsLoading: false,
    };
  }

  componentDidMount = () => {
    this.getComponents();
  };
  getComponents = () => {
    axios
      .get(`${config.dataApi}admin/component`)
      .then((res) => {
        this.setState({ components: res.data, componentsLoading: false });
      })
      .catch((err) => {
        this.props.addError(err);
        this.setState({ componentsLoading: false });
      });
  };

  toggleMaintenance = (checked) => {
    axios
      .post(`${config.dataApi}admin/maintenance`)
      .then(BackgroundProvider.getBackground);
  };

  updateComponent = (comp, checked) => {
    const method = checked ? "start" : "stop";
    this.setState({ componentsLoading: true });
    axios
      .post(`${config.dataApi}admin/component/${method}?comp=${comp}`)
      .then(this.getComponents)
      .catch((err) => {
        this.props.addError(err);
        this.setState({ componentsLoading: false });
      });
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

  reindexScheduler = () => {
    this.setState({ reindexSchedulerLoading: true });
    axios
      .post(`${config.dataApi}admin/reindex/scheduler`)
      .then((res) => {
        this.setState(
          {
            reindexSchedulerLoading: false,
            error: null,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "Run reindex scheduler",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          reindexSchedulerLoading: false,
        })
      );
  };

  rematchScheduler = () => {
    this.setState({ rematchSchedulerLoading: true });
    axios
      .post(`${config.dataApi}admin/rematch/scheduler`)
      .then((res) => {
        this.setState(
          {
            rematchSchedulerLoading: false,
            error: null,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "Run rematch scheduler",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          rematchSchedulerLoading: false,
        })
      );
  };

  restartAll = () => {
    axios
      .post(`${config.dataApi}admin/component/restart-all`)
      .then((res) => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "All components restarted",
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
      reindexSchedulerLoading,
      rematchSchedulerLoading,
      error,
      components: components,
      componentsLoading: componentsLoading,
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
            <Space direction="horizontal" size={[50, 0]} wrap>
              <FormItem label="Background jobs">
                {components.idle && (
                  <Badge
                    count={"idle"}
                    style={{ backgroundColor: "#52c41a" }}
                  />
                )}
                {components.idle || (
                  <Badge count={"active"} style={{ backgroundColor: "red" }} />
                )}
              </FormItem>

              <FormItem label="Maintenance">
                <Switch
                  loading={componentsLoading}
                  onChange={(checked) => {
                    this.toggleMaintenance(checked);
                  }}
                  checked={background && background.maintenance}
                />
              </FormItem>
            </Space>
          </Row>

          <Row>
            <Space direction="horizontal" size={[50, 0]} wrap>
              {Object.keys(components)
                .filter((c) => c != "idle")
                .map((comp) => (
                  <FormItem label={comp}>
                    <Switch
                      loading={componentsLoading}
                      onChange={(checked) => {
                        this.updateComponent(comp, checked);
                      }}
                      checked={components[comp]}
                    />
                  </FormItem>
                ))}
            </Space>
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
              title="Do you want to schedule reindexing incomplete datasets?"
              onConfirm={this.reindexScheduler}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={reindexSchedulerLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Reindex scheduler
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Do you want to schedule rematching incomplete datasets?"
              onConfirm={this.rematchScheduler}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={rematchSchedulerLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Rematch scheduler
              </Button>
            </Popconfirm>
            <Popconfirm
              placement="rightTop"
              title="Do you want to restart all components?"
              onConfirm={this.restartAll}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Restart all components
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
  background,
  addError,
}) => ({
  catalogueKey,
  catalogue,
  setCatalogue,
  background,
  addError,
});
export default withContext(mapContextToProps)(AdminPage);
