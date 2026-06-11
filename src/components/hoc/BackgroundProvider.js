import { useEffect } from "react";
import withContext from "./withContext";
import config from "../../config";

const { backgroundHeartBeat } = config;

// System health is polled on its own per-env interval (config.systemHealthHeartBeat),
// independent of the background task heartbeat, so the health badge count updates
// at most once per the configured interval. Defaults to once a minute.
const systemHealthHeartBeat = config.systemHealthHeartBeat || 60000;

const BackgroundProvider = ({ getBackground, getSystemHealth }) => {
  useEffect(() => {
    getBackground();
    getSystemHealth();
    const t = setInterval(getBackground, backgroundHeartBeat);
    const sysT = setInterval(getSystemHealth, systemHealthHeartBeat);
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
