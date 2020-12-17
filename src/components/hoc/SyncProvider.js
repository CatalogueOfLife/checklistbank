import React from "react";
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
    const nextCatalogueKey = _.get(this.props, "match.params.catalogueKey");
    const {
      match: {
        params: { catalogueKey },
      },
    } = prevProps;

    if (nextCatalogueKey && Number(catalogueKey) !== Number(nextCatalogueKey)) {
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

export default withContext(mapContextToProps)(SyncProvider);
