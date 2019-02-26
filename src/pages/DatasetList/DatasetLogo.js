import React from "react";
import config from "../../config";
import axios from "axios";

class DatasetLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasLogo: false
    };
  }
  componentDidMount = () => {
    const { datasetKey } = this.props;

    axios(`${config.dataApi}dataset/${datasetKey}/logo?size=large`)
      .then(res => this.setState({ hasLogo: true }))
      .catch(err => {});
  };
  render = () => {
    const { hasLogo } = this.state;
    const { datasetKey } = this.props;
    return hasLogo ? (
      <img style={{
        height: "auto",
        maxHeight: "40px",
        maxWidth:"40px",
        width: "auto"
    }} src={`${config.dataApi}dataset/${datasetKey}/logo?size=small`} />
    ) : (
      ""
    );
  };
}

export default DatasetLogo;
