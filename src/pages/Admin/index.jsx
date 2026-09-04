import { useEffect, useState, useRef } from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import { Helmet } from "react-helmet-async";
import {
  Row,
  Divider,
  Space,
  Switch,
  Button,
  Alert,
  Popconfirm,
  Segmented,
  App,
  Form,
  Input,
} from "antd";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";
import {
  COMPONENT,
  JOB_EXECUTOR_STATE,
  getComponentState,
  getJobsState,
  jobExecutorState,
  pauseJobs,
  resumeJobs,
  startComponent,
  stopComponent,
} from "../../api/admin";

const pollingHeartBeat = config.pollingHeartBeat || 5000;
const healthHeartBeat = config.healthHeartBeat || 60000;

const FormItem = Form.Item;

const AdminPage = ({ background, addError, getBackground }) => {
  const { notification, modal } = App.useApp();
  const [error, setError] = useState(null);
  const [updateAllLogosloading, setUpdateAllLogosloading] = useState(false);
  const [metricsSchedulerloading, setMetricsSchedulerloading] = useState(false);
  const [reindexSchedulerLoading, setReindexSchedulerLoading] = useState(false);
  const [rematchMissingLoading, setRematchMissingLoading] = useState(false);
  const [updateUsageCountsLoading, setUpdateUsageCountsLoading] = useState(false);
  // { idle, quiesced, components: { <name>: { running, autostart } } }
  const [state, setState] = useState({ components: {} });
  const components = state.components || {};
  const [componentsLoading, setComponentsLoading] = useState(false);
  // { started, paused, quiesced, idle, queued, running: [key] }
  const [jobs, setJobs] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  // The job endpoints are admin only while this page also admits editors.
  // Once refused there is nothing to poll for and nothing to offer.
  const [jobsForbidden, setJobsForbidden] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const maintenancePrefilled = useRef(false);

  useEffect(() => {
    getComponents();
    getJobs();
  }, []);

  // While the executor is draining - paused, but a job it may not interrupt is
  // still running - the interesting bit changes within seconds, so poll fast.
  // Otherwise this is a control panel, not a dashboard: the slow cadence is
  // only there so the queue counts do not go stale while it is left open.
  useEffect(() => {
    if (jobsForbidden) return undefined;
    const draining = jobs?.paused && !jobs?.quiesced;
    const t = setInterval(
      getJobs,
      draining ? pollingHeartBeat : healthHeartBeat
    );
    return () => clearInterval(t);
  }, [jobs?.paused, jobs?.quiesced, jobsForbidden]);

  // Prefill the message box from the current status file once it has loaded,
  // without clobbering the admin's edits on later background polls.
  useEffect(() => {
    if (!maintenancePrefilled.current && background) {
      setMaintenanceMessage(background.message || "");
      maintenancePrefilled.current = true;
    }
  }, [background]);

  const getComponents = () =>
    getComponentState()
      .then((res) => {
        setState(res);
        setComponentsLoading(false);
      })
      .catch((err) => {
        addError(err);
        setComponentsLoading(false);
      });

  const getJobs = () =>
    getJobsState()
      .then(setJobs)
      .catch((err) => {
        // An editor on this page is simply not allowed here, which is not an
        // error to report - and certainly not once per poll.
        if ([401, 403].includes(_.get(err, "response.status"))) {
          setJobsForbidden(true);
          return;
        }
        addError(err);
      });

  const jobsStatus = jobExecutorState(jobs);

  // What the three states leave open: how much work is still in flight. Quiet
  // only bites once the executor has quiesced, i.e. once the jobs that were
  // already running have ended, so say so while that is still pending.
  const jobsHelp = (() => {
    if (!jobs) return undefined;
    const running = jobs.running?.length || 0;
    const queued = jobs.queued || 0;
    if (jobsStatus === JOB_EXECUTOR_STATE.STOPPED) return "queue discarded";
    const load = `${running} running, ${queued} queued`;
    if (jobsStatus === JOB_EXECUTOR_STATE.QUIET) {
      return jobs.quiesced
        ? `quiesced - ${queued} queued and held`
        : `draining - ${load}`;
    }
    return load;
  })();

  /**
   * Move the job executor between its three states. Quiet and running are the
   * pause gate, stopped is the component lifecycle, so getting from stopped to
   * either of the other two has to start the component first.
   */
  const setJobsStatus = async (next) => {
    if (next === jobsStatus) return;
    setJobsLoading(true);
    try {
      if (next === JOB_EXECUTOR_STATE.STOPPED) {
        await stopComponent(COMPONENT.JOB_EXECUTOR);
      } else {
        if (jobsStatus === JOB_EXECUTOR_STATE.STOPPED) {
          await startComponent(COMPONENT.JOB_EXECUTOR);
        }
        if (next === JOB_EXECUTOR_STATE.QUIET) {
          await pauseJobs();
        } else {
          await resumeJobs();
        }
      }
    } catch (err) {
      addError(err);
    }
    // Refresh either way: a failed step may still have changed the server.
    await Promise.all([getJobs(), getComponents()]);
    setJobsLoading(false);
  };

  const onJobsStatusChange = (next) => {
    if (next !== JOB_EXECUTOR_STATE.STOPPED) {
      setJobsStatus(next);
      return;
    }
    modal.confirm({
      title: "Stop the job executor?",
      content:
        "Running jobs are interrupted and the whole queue is discarded. To let " +
        "the running jobs finish and keep the queue, choose quiet instead.",
      okText: "Stop",
      okButtonProps: { danger: true },
      onOk: () => setJobsStatus(JOB_EXECUTOR_STATE.STOPPED),
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

        {!jobsForbidden && (
          <Row>
            <FormItem
              label="Background jobs"
              help={jobsHelp}
              style={{ marginBottom: jobsHelp ? 0 : undefined }}
            >
              <Segmented
                disabled={jobsLoading || !jobs}
                value={jobsStatus}
                onChange={onJobsStatusChange}
                options={[
                  {
                    value: JOB_EXECUTOR_STATE.RUNNING,
                    label: "Running",
                    title: "Jobs are picked up from the queue as usual",
                  },
                  {
                    value: JOB_EXECUTOR_STATE.QUIET,
                    label: "Quiet",
                    title:
                      "Start nothing new, let the running jobs finish, keep the queue",
                  },
                  {
                    value: JOB_EXECUTOR_STATE.STOPPED,
                    label: "Stopped",
                    title:
                      "Reject submissions, interrupt what runs and discard the queue",
                  },
                ]}
              />
            </FormItem>
          </Row>
        )}

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
              // the job executor has the three state control of its own above,
              // a second two state switch for it would only disagree with it
              .filter((comp) => comp !== COMPONENT.JOB_EXECUTOR)
              .map((comp) => (
                <FormItem
                  key={comp}
                  label={comp}
                  // not started by start-all here, so being off is not a fault
                  help={components[comp].autostart ? undefined : "manual"}
                >
                  <Switch
                    loading={componentsLoading}
                    onChange={(checked) => {
                      updateComponent(comp, checked);
                    }}
                    checked={components[comp].running}
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
          <a href={`${config.dataApi}monitor-ro/threads`}>Threads</a>
          &nbsp;-&nbsp;
          <a href={`${config.dataApi}monitor-ro/metrics`}>Metrics</a>
          &nbsp;-&nbsp;
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
