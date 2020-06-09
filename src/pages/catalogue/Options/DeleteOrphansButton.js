import React from "react";
import { Button, notification } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";

const DeleteOrphansButton = ({ type, datasetKey, style }) => (
  <Button
    style={style}
    type="danger"
    onClick={() => {
      axios
        .delete(`${config.dataApi}dataset/${datasetKey}/${type}/orphans`)
        .then((res) => {
          notification.open({
            message: `Deleting ${type} orphans`,
          });
        })
        .catch((err) => {
          notification.error({
            message: "Error",
            description: <ErrorMsg error={err} />,
          });
        });
    }}
  >{`Delete orphan ${type}s`}</Button>
);

export default DeleteOrphansButton;
