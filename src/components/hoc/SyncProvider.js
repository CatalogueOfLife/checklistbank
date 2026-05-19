import { useEffect } from "react";
import withRouter from "../../withRouter";
import withContext from "./withContext";
import config from "../../config";

const { syncStateHeartbeat } = config;

const SyncProvider = ({ getSyncState, match }) => {
  const projectKey = match?.params?.projectKey;

  useEffect(() => {
    getSyncState();
    const t = setInterval(getSyncState, syncStateHeartbeat);
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
