import { useState } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Popover, Popconfirm, notification } from "antd";
import { Navigate } from "react-router-dom";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

const DeleteDatasetButton = ({ record, style }) => {
  const [deletionTriggered, setDeletionTriggered] = useState(false);
  const [error, setError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const deleteDataset = () => {
    setDeletionTriggered(true);
    axios
      .delete(`${config.dataApi}dataset/${record.key}`)
      .then((res) => {
        notification.success({
          message: "Deletion succeeded",
          description: `The dataset "${record.title}" was deleted`,
        });
        setDeletionTriggered(false);
        setDeleteSuccess(true);
      })
      .catch((err) => {
        setDeletionTriggered(false);
        setError(err);
        setDeleteSuccess(false);
      });
  };

  if (deleteSuccess) return <Navigate to="/dataset" replace />;

  return (
    <>
      <Popconfirm
        placement="left"
        title={`Delete ${record.title}?`}
        onConfirm={deleteDataset}
        okText="Yes"
        cancelText="No"
      >
        <Button
          style={style}
          type={"danger"}
          loading={deletionTriggered}
          disabled={deletionTriggered}
        >
          Delete
        </Button>
      </Popconfirm>
      {error && (
        <Popover
          placement="bottom"
          title="Error"
          content={<ErrorMsg error={error} />}
          trigger="click"
        >
          <WarningOutlined
            style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}
          />
        </Popover>
      )}
    </>
  );
};

export default DeleteDatasetButton;
