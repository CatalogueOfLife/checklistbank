import React from "react";
import { withRouter } from "react-router-dom";
import { SyncOutlined } from "@ant-design/icons";
import _ from "lodash";
import withContext from "../hoc/withContext";
import SyncStatePresentation from "../../pages/catalogue/Assembly/SyncState";
import { Modal } from "antd";

class SyncState extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false };
  }

  render = () => {
    const { syncState, syncingSector, syncingDataset } = this.props;
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;

    return catalogueKey ? (
      <React.Fragment>
        {_.get(syncState, "running") ? (
          <SyncOutlined
            style={{ color: "green", marginRight: "4px" }}
            spin
            onClick={() => this.setState({ visible: true })}
          />
        ) : (
          <SyncOutlined
            style={{ marginRight: "4px" }}
            onClick={() => this.setState({ visible: true })}
          />
        )}
        <Modal
          title="Sync state"
          visible={this.state.visible}
          onCancel={() => this.setState({ visible: false })}
          footer={null}
        >
          <SyncStatePresentation
            syncState={syncState}
            sector={syncingSector}
            dataset={syncingDataset}
          />
        </Modal>
      </React.Fragment>
    ) : null;
  };
}
const mapContextToProps = ({ syncState, syncingSector, syncingDataset }) => ({
  syncState,
  syncingSector,
  syncingDataset,
});

export default withContext(mapContextToProps)(withRouter(SyncState));
