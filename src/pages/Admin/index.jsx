import { useEffect, useState, useRef } from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
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
  App,
  Form,
  Input,
} from "antd";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";

const FormItem = Form.Item;

const AdminPage = ({ background, addError, getBackground }) => {
  const { notification } = App.useApp();
  const [error, setError] = useState(null);
  const [updateAllLogosloading, setUpdateAllLogosloading] = useState(false);
  const [metricsSchedulerloading, setMetricsSchedulerloading] = useState(false);
  const [reindexSchedulerLoading, setReindexSchedulerLoading] = useState(false);
  const [rematchMissingLoading, setRematchMissingLoading] = useState(false);
  const [updateUsageCountsLoading, setUpdateUsageCountsLoading] = useState(false);
  const [components, setComponents] = useState({ foo: true, bar: false });
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const maintenancePrefilled = useRef(false);

  useEffect(() => {
    getComponents();
  }, []);

  // Prefill the message box from the current status file once it has loaded,
  // without clobbering the admin's edits on later background polls.
  useEffect(() => {
    if (!maintenancePrefilled.current && background) {
      setMaintenanceMessage(background.message || "");
      maintenancePrefilled.current = true;
    }
  }, [background]);

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

  // Set maintenance on/off together with the optional custom banner message.
  const setMaintenance = (on) => {
    setMaintenanceLoading(true);
    axios
      .post(`${config.dataApi}admin/maintenance`, null, {
        params: { on, message: maintenanceMessage || undefined },
      })
      .then(() => getBackground && getBackground())
      .catch((err) => addError(err))
      .finally(() => setMaintenanceLoading(false));
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
          <FormItem label="Background jobs">
            {components.idle && (
              <Badge count={"idle"} style={{ backgroundColor: "#52c41a" }} />
            )}
            {components.idle || (
              <Badge count={"active"} style={{ backgroundColor: "red" }} />
            )}
          </FormItem>
        </Row>

        <Row>
          <FormItem label="Maintenance">
            <Space orientation="horizontal" align="center">
              <Switch
                loading={maintenanceLoading}
                onChange={(checked) => setMaintenance(checked)}
                checked={background && background.maintenance}
              />
              <Input.TextArea
                autoSize={{ minRows: 1 }}
                style={{ width: 360 }}
                placeholder="Optional custom banner message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
              />
            </Space>
          </FormItem>
        </Row>

        <Row>
          <Space orientation="horizontal" size={[50, 0]} wrap>
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
  project,
  setProject,
  background,
  addError,
  getBackground,
}) => ({
  projectKey,
  project,
  setProject,
  background,
  addError,
  getBackground,
});
export default withContext(mapContextToProps)(AdminPage);
