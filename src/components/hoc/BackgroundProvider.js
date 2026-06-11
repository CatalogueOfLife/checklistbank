import { useEffect } from "react";
import withContext from "./withContext";
import config from "../../config";

// Two configurable cadences (per env, in src/env.json):
// - healthHeartBeat: how often the system health/components are polled (~60s)
// - pollingHeartBeat: default for all other foreground/background polling (~5s)
const pollingHeartBeat = config.pollingHeartBeat || 5000;
const healthHeartBeat = config.healthHeartBeat || 60000;

const BackgroundProvider = ({ getBackground, getSystemHealth }) => {
  useEffect(() => {
    getBackground();
    getSystemHealth();
    const t = setInterval(getBackground, pollingHeartBeat);
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
