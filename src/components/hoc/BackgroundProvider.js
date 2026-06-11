import { useEffect } from "react";
import withContext from "./withContext";
import config from "../../config";

// Configurable cadences (per env, in src/env.json):
// - healthHeartBeat: how often the system health/components are polled (~60s)
// - maintenanceHeartBeat: how often .status.json (maintenance banner /
//   background task status) is polled (~60s)
// - pollingHeartBeat: default for all other foreground polling (~5s)
const maintenanceHeartBeat = config.maintenanceHeartBeat || 60000;
const healthHeartBeat = config.healthHeartBeat || 60000;

const BackgroundProvider = ({
  getBackground,
  getSystemHealth,
  getJobQueue,
  user,
}) => {
  useEffect(() => {
    getBackground();
    getSystemHealth();
    const t = setInterval(getBackground, maintenanceHeartBeat);
    const sysT = setInterval(getSystemHealth, healthHeartBeat);
    return () => {
      clearInterval(t);
      clearInterval(sysT);
    };
  }, []);

  // The job queue is only relevant to (and only shown for) logged-in users,
  // so poll it on the health cadence only while authenticated.
  useEffect(() => {
    if (!user) return undefined;
    getJobQueue();
    const t = setInterval(getJobQueue, healthHeartBeat);
    return () => clearInterval(t);
  }, [user?.key]);

  return null;
};

const mapContextToProps = ({
  getBackground,
  getSystemHealth,
  getJobQueue,
  user,
}) => ({
  getBackground,
  getSystemHealth,
  getJobQueue,
  user,
});

export default withContext(mapContextToProps)(BackgroundProvider);
