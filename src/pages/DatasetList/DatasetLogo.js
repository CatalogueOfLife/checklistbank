import React from "react";
import config from "../../config";

class DatasetLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: true, loading: true };
  }

  render() {
    const {
      fallBack = null,
      datasetKey,
      style = {},
      size = "MEDIUM",
    } = this.props;
    const { error, loading } = this.state;
    return loading || !error ? (
      <img
        style={{ maxWidth: "80px", maxHeight: "50px", ...style }}
        alt={`Dataset ${datasetKey} logo`}
        src={`${config.dataApi}dataset/${datasetKey}/logo?size=${size}`}
        onLoad={() => this.setState({ error: false, loading: false })}
        onError={() => this.setState({ error: true, loading: false })}
      />
    ) : (
      fallBack
    );
  }
}
export default DatasetLogo;
