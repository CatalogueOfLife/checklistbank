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

const BackgroundProvider = ({ getBackground, getSystemHealth }) => {
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
  return null;
};

const mapContextToProps = ({ getBackground, getSystemHealth }) => ({
  getBackground,
  getSystemHealth,
});

export default withContext(mapContextToProps)(BackgroundProvider);
