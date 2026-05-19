import { useState } from "react";
import withRouter from "../../withRouter";
import { SyncOutlined } from "@ant-design/icons";
import _ from "lodash";
import withContext from "../hoc/withContext";
import SyncStatePresentation from "../../pages/project/Assembly/SyncState";
import { Modal } from "antd";

const SyncState = ({ syncState, syncingSector, syncingDataset, match }) => {
  const [visible, setVisible] = useState(false);
  const {
    params: { projectKey },
  } = match;

  return projectKey ? (
    <>
      {_.get(syncState, "running") ? (
        <SyncOutlined
          style={{ color: "green", marginRight: "4px" }}
          spin
          onClick={() => setVisible(true)}
        />
      ) : (
        <SyncOutlined
          style={{ marginRight: "4px" }}
          onClick={() => setVisible(true)}
        />
      )}
      <Modal
        title="Sync state"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <SyncStatePresentation
          syncState={syncState}
          sector={syncingSector}
          dataset={syncingDataset}
        />
      </Modal>
    </>
  ) : null;
};

const mapContextToProps = ({ syncState, syncingSector, syncingDataset }) => ({
  syncState,
  syncingSector,
  syncingDataset,
});

export default withContext(mapContextToProps)(withRouter(SyncState));
