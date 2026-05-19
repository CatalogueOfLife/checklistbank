import { useEffect, useState } from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import BackgroundProvider from "../../components/hoc/BackgroundProvider";
import config from "../../config";
import { Helmet } from "react-helmet-async";
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

const AdminPage = ({ background, addError }) => {
  const [error, setError] = useState(null);
  const [updateAllLogosloading, setUpdateAllLogosloading] = useState(false);
  const [metricsSchedulerloading, setMetricsSchedulerloading] = useState(false);
  const [reindexSchedulerLoading, setReindexSchedulerLoading] = useState(false);
  const [rematchMissingLoading, setRematchMissingLoading] = useState(false);
  const [updateUsageCountsLoading, setUpdateUsageCountsLoading] = useState(false);
  const [components, setComponents] = useState({ foo: true, bar: false });
  const [componentsLoading, setComponentsLoading] = useState(false);

  useEffect(() => {
    getComponents();
  }, []);

  const getComponents = () => {
    axios
      .get(`${config.dataApi}admin/component`)
      .then((res) => {
        setComponents(res.data);
        setComponentsLoading(false);
      })
      .catch((err) => {
        addError(err);
        setComponentsLoading(false);
      });
  };

  const toggleMaintenance = (checked) => {
    axios
      .post(`${config.dataApi}admin/maintenance`)
      .then(BackgroundProvider.getBackground);
  };

  const updateComponent = (comp, checked) => {
    const method = checked ? "start" : "stop";
    setComponentsLoading(true);
    axios
      .post(`${config.dataApi}admin/component/${method}?comp=${comp}`)
      .then(getComponents)
      .catch((err) => {
        addError(err);
        setComponentsLoading(false);
      });
  };

  const updateAllLogos = () => {
    setUpdateAllLogosloading(true);
    axios
      .post(`${config.dataApi}admin/logo-update`)
      .then((res) => {
        setUpdateAllLogosloading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "updating all logos async",
        });
      })
      .catch((err) => {
        setError(err);
        setUpdateAllLogosloading(false);
      });
  };

  const metricsScheduler = () => {
    setMetricsSchedulerloading(true);
    axios
      .post(`${config.dataApi}admin/rebuild-taxon-metrics/scheduler`)
      .then((res) => {
        setMetricsSchedulerloading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "Run taxon metrics rebuild scheduler",
        });
      })
      .catch((err) => {
        setError(err);
        setMetricsSchedulerloading(false);
      });
  };

  const updateUsageCounts = () => {
    setUpdateUsageCountsLoading(true);
    axios
      .post(`${config.dataApi}admin/counter-update`)
      .then((res) => {
        setUpdateUsageCountsLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "updating all managed usage counts",
        });
      })
      .catch((err) => {
        setError(err);
        setUpdateUsageCountsLoading(false);
      });
  };

  const reindexScheduler = () => {
    setReindexSchedulerLoading(true);
    axios
      .post(`${config.dataApi}admin/reindex/scheduler`)
      .then((res) => {
        setReindexSchedulerLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "Run reindex scheduler",
        });
      })
      .catch((err) => {
        setError(err);
        setReindexSchedulerLoading(false);
      });
  };

  const rematchMissing = () => {
    setRematchMissingLoading(true);
    axios
      .post(`${config.dataApi}admin/rematch/missing`)
      .then((res) => {
        setRematchMissingLoading(false);
        setError(null);
        notification.open({
          message: "Action triggered",
          description: "Run rematch missing",
        });
      })
      .catch((err) => {
        setError(err);
        setRematchMissingLoading(false);
      });
  };

  const restartAll = () => {
    axios
      .post(`${config.dataApi}admin/component/restart-all`)
      .then((res) => {
        setError(null);
        notification.open({
          message: "All components restarted",
        });
      })
      .catch((err) => setError(err));
  };

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
              closable={{ onClose: () => setError(null) }}
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
                  toggleMaintenance(checked);
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
                      updateComponent(comp, checked);
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
            onConfirm={updateAllLogos}
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
            onConfirm={updateUsageCounts}
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
            onConfirm={reindexScheduler}
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
            onConfirm={rematchMissing}
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
            onConfirm={metricsScheduler}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={metricsSchedulerloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Metrics scheduler
            </Button>
          </Popconfirm>

          <Popconfirm
            placement="rightTop"
            title="Do you want to restart all components?"
            onConfirm={restartAll}
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

        <Divider titlePlacement="left">Links</Divider>
        <Row>
          <a href={config.downloadApi}>Downloads</a>&nbsp;-&nbsp;
          <a href={`${config.dataApi}dataset/duplicates`}>Duplicate Datasets</a>
        </Row>

        <Divider titlePlacement="left">Main</Divider>
        <Row>
          <a href={`${config.dataApi}monitor/healthcheck`}>Health</a>&nbsp;-&nbsp;
          <a href={`${config.dataApi}monitor/threads`}>Threads</a>&nbsp;-&nbsp;
          <a href={`${config.dataApi}monitor/metrics`}>Metrics</a>&nbsp;-&nbsp;
          <a href={`${config.dataApi}monitor/pprof`}>CPU Profile</a>&nbsp;-&nbsp;
          <a href={`${config.dataApi}monitor/pprof?state=blocked`}>
            CPU Blocked
          </a>
        </Row>

        <Divider titlePlacement="left">Read only</Divider>
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
};

const mapContextToProps = ({
  projectKey,
  catalogue,
  setCatalogue,
  background,
  addError,
}) => ({
  projectKey,
  catalogue,
  setCatalogue,
  background,
  addError,
});
export default withContext(mapContextToProps)(AdminPage);
