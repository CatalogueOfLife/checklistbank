import { useEffect } from "react";
import withRouter from "../../withRouter";
import withContext from "./withContext";
import config from "../../config";

const pollingHeartBeat = config.pollingHeartBeat || 5000;

/**
 * Polls the live job queue of the currently open project.
 *
 * Replaces the old SyncProvider, which polled GET dataset/{key}/assembly.
 * Sector syncs are ordinary background jobs since the unified job API, so the
 * generic queue - filtered to the project - answers everything the dedicated
 * sync state used to, and covers releases and exports of the project too.
 */
const ProjectJobProvider = ({ getProjectJobQueue, match }) => {
  const projectKey = match?.params?.projectKey;

  useEffect(() => {
    getProjectJobQueue();
    const t = setInterval(getProjectJobQueue, pollingHeartBeat);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (projectKey) getProjectJobQueue();
  }, [projectKey]);

  return null;
};

const mapContextToProps = ({ getProjectJobQueue }) => ({
  getProjectJobQueue,
});

export default withRouter(withContext(mapContextToProps)(ProjectJobProvider));
