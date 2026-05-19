import { useState } from "react";
import config from "../../config";
import { Button, Popconfirm, notification } from "antd";
import axios from "axios";

const SyncAllSectorsButton = ({ onError, dataset, projectKey, text }) => {
  const [allSectorSyncloading, setAllSectorSyncloading] = useState(false);

  const syncAllSectors = () => {
    setAllSectorSyncloading(true);
    const body = dataset ? { datasetKey: dataset.key } : { all: true };

    axios
      .post(`${config.dataApi}dataset/${projectKey}/sector/sync`, body)
      .then((res) => {
        setAllSectorSyncloading(false);
        notification.open({
          message: "Action triggered",
          description: `All sectors syncing${
            dataset ? " for dataset: " + dataset.title : ""
          }`,
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
        setAllSectorSyncloading(false);
      });
  };

  return (
    <>
      <Popconfirm
        placement="rightTop"
        title="Sync all sectors?"
        onConfirm={syncAllSectors}
        okText="Yes"
        cancelText="No"
      >
        <Button
          type="primary"
          loading={allSectorSyncloading}
          style={{ marginRight: "10px", marginBottom: "10px" }}
        >
          {text || "Sync all sectors"}
        </Button>
      </Popconfirm>
    </>
  );
};

export default SyncAllSectorsButton;
