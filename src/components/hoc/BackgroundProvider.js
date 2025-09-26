import React from "react";
import withContext from "./withContext";
import _ from "lodash";
import config from "../../config";

const { backgroundHeartBeat } = config;

class BackgroundProvider extends React.Component {
  componentDidMount = () => {
    this.props.getBackground();
    this.timer = setInterval(() => {
      this.props.getBackground();
    }, backgroundHeartBeat);
    this.systemTimer = setInterval(() => {
      this.props.getSystemHealth();
    }, backgroundHeartBeat);
  };

  componentWillUnmount() {
    clearInterval(this.timer);
    clearInterval(this.systemTimer);
  }

  render = () => {
    return null;
  };
}

const mapContextToProps = ({ getBackground, getSystemHealth }) => ({
  getBackground,
  getSystemHealth,
});

export default withContext(mapContextToProps)(BackgroundProvider);
