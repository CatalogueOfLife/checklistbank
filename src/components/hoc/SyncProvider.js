import { useEffect } from "react";
import withRouter from "../../withRouter";
import withContext from "./withContext";
import config from "../../config";

const pollingHeartBeat = config.pollingHeartBeat || 5000;

const SyncProvider = ({ getSyncState, match }) => {
  const projectKey = match?.params?.projectKey;

  useEffect(() => {
    getSyncState();
    const t = setInterval(getSyncState, pollingHeartBeat);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (projectKey) getSyncState();
  }, [projectKey]);

  return null;
};

const mapContextToProps = ({ getSyncState }) => ({
  getSyncState,
});

export default withRouter(withContext(mapContextToProps)(SyncProvider));
