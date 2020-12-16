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
  };

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render = () => {
    return null;
  };
}

const mapContextToProps = ({ getBackground }) => ({
  getBackground,
});

export default withContext(mapContextToProps)(BackgroundProvider);
