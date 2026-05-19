import { useEffect } from "react";
import withContext from "./withContext";
import config from "../../config";

const { backgroundHeartBeat } = config;

const BackgroundProvider = ({ getBackground, getSystemHealth }) => {
  useEffect(() => {
    getBackground();
    const t = setInterval(getBackground, backgroundHeartBeat);
    const sysT = setInterval(getSystemHealth, backgroundHeartBeat);
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
