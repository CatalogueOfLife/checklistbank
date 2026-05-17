import React from "react";
import withRouter from "../../withRouter";
import withContext from "./withContext";
import _ from "lodash";
import config from "../../config";

const { syncStateHeartbeat } = config;

class SyncProvider extends React.Component {
  componentDidMount = () => {
    this.props.getSyncState();
    this.timer = setInterval(() => {
      this.props.getSyncState();
    }, syncStateHeartbeat);
  };

  componentDidUpdate = (prevProps) => {
    const nextCatalogueKey = _.get(this.props, "match.params.projectKey");
    const {
      match: {
        params: { projectKey },
      },
    } = prevProps;

    if (nextCatalogueKey && Number(projectKey) !== Number(nextCatalogueKey)) {
      this.props.getSyncState();
    }
  };
  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render = () => {
    return null;
  };
}

const mapContextToProps = ({ getSyncState }) => ({
  getSyncState,
});

export default withRouter(withContext(mapContextToProps)(SyncProvider));
