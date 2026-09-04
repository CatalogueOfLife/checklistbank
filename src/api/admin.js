import axios from "axios";
import config from "../config";

/**
 * Client for the server control endpoints under /admin.
 *
 * Two concerns live here and they are deliberately kept apart:
 *   - the managed components (start / stop / restart), and
 *   - the job executor, which on top of the component lifecycle has a pause
 *     gate used for maintenance.
 */

/** Component enum constant names, as the ?comp= parameter spells them. */
export const COMPONENT = {
  JOB_EXECUTOR: "JobExecutor",
};

/**
 * GET /admin/component:
 *   { idle, quiesced, components: { <name>: { running, autostart } } }
 *
 * A component that is disabled for the environment is not reported at all, and
 * `autostart` says whether start-all is the one that brings it up here.
 */
export const getComponentState = () =>
  axios.get(`${config.dataApi}admin/component`).then(({ data }) => ({
    idle: data?.idle,
    quiesced: data?.quiesced,
    components: data?.components || {},
  }));

export const startComponent = (comp) =>
  axios.post(`${config.dataApi}admin/component/start`, null, {
    params: { comp },
  });

export const stopComponent = (comp) =>
  axios.post(`${config.dataApi}admin/component/stop`, null, {
    params: { comp },
  });

export const restartAllComponents = () =>
  axios.post(`${config.dataApi}admin/component/restart-all`);

/**
 * The three operator states of the job executor. They span two backend verbs:
 * start/stop is the component lifecycle - a stop rejects submissions,
 * interrupts what runs and discards the queue - while quiet is the pause gate,
 * which lets the running jobs finish and keeps the queue.
 */
export const JOB_EXECUTOR_STATE = {
  RUNNING: "running",
  QUIET: "quiet",
  STOPPED: "stopped",
};

/** GET /admin/jobs/state: { started, paused, quiesced, idle, queued, running[] } */
export const getJobsState = () =>
  axios.get(`${config.dataApi}admin/jobs/state`).then(({ data }) => data);

/**
 * Pause the executor. With `awaitSeconds` the call only answers once no job is
 * running any more; the backend replies 409 - and axios rejects - if a job
 * outlives that deadline. Paused either way, so the caller can just refresh.
 */
export const pauseJobs = (awaitSeconds) =>
  axios
    .post(`${config.dataApi}admin/jobs/pause`, null, {
      params: { await: awaitSeconds },
    })
    .then(({ data }) => data);

export const resumeJobs = () =>
  axios.post(`${config.dataApi}admin/jobs/resume`).then(({ data }) => data);

/** Which of the three states the /admin/jobs/state payload describes. */
export const jobExecutorState = (jobs) => {
  if (!jobs || !jobs.started) return JOB_EXECUTOR_STATE.STOPPED;
  return jobs.paused ? JOB_EXECUTOR_STATE.QUIET : JOB_EXECUTOR_STATE.RUNNING;
};
