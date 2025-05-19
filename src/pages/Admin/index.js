import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import BackgroundProvider from "../../components/hoc/BackgroundProvider";
import config from "../../config";
import Helmet from "react-helmet";
import {
  Row,
  Divider,
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
      metricsSchedulerloading: false,
      reindexSchedulerLoading: false,
      rematchMissingLoading: false,
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

  metricsScheduler = () => {
    this.setState({ metricsSchedulerloading: true });
    axios
      .post(`${config.dataApi}admin/rebuild-taxon-metrics/scheduler`)
      .then((res) => {
        this.setState({ metricsSchedulerloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "Run taxon metrics rebuild scheduler",
          });
        });
      })
      .catch((err) =>
        this.setState({
          error: err,
          metricsSchedulerloading: false,
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

  rematchMissing = () => {
    this.setState({ rematchMissingLoading: true });
    axios
      .post(`${config.dataApi}admin/rematch/missing`)
      .then((res) => {
        this.setState(
          {
            rematchMissingLoading: false,
            error: null,
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "Run rematch missing",
            });
          }
        );
      })
      .catch((err) =>
        this.setState({
          error: err,
          rematchMissingLoading: false,
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
      metricsSchedulerLoading,
      updateUsageCountsLoading,
      reindexSchedulerLoading,
      rematchMissingLoading,
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
              title="Do you want to match all names without a match?"
              onConfirm={this.rematchMissing}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={rematchMissingLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Rematch missing
              </Button>
            </Popconfirm>

            <Popconfirm
              placement="rightTop"
              title="Do you want to schedule to rebuild taxon metrics for incomplete datasets?"
              onConfirm={this.metricsScheduler}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={metricsSchedulerLoading}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Metrics scheduler
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

          <Divider orientation="left">Links</Divider>
          <Row>
            <a href={config.downloadApi}>Downloads</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}dataset/duplicates`}>Duplicate Datasets</a>
          </Row>

          <Divider orientation="left">Main</Divider>
          <Row> 
            <a href={`${config.dataApi}monitor/healthcheck`}>Health</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor/threads`}>Threads</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor/metrics`}>Metrics</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor/pprof`}>CPU Profile</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor/pprof?state=blocked`}>
              CPU Blocked
            </a>
          </Row>

          <Divider orientation="left">Read only</Divider>
          <Row> 
            <a href={`${config.dataApi}monitor-ro/healthcheck`}>Health</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor-ro/threads`}>Threads</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor-ro/metrics`}>Metrics</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor-ro/pprof`}>CPU Profile</a>&nbsp;-&nbsp;
            <a href={`${config.dataApi}monitor-ro/pprof?state=blocked`}>
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
