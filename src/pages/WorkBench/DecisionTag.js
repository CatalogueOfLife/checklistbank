import React from "react";
import _ from "lodash";
import config from "../../config";
import axios from "axios";
import { Tooltip, Tag, notification } from "antd";
import withContext from "../../components/hoc/withContext";

import Auth from "../../components/Auth";
const { canEditDataset } = Auth;
const deleteDecision = (id, deleteCallback, projectKey) => {
  return axios
    .delete(`${config.dataApi}dataset/${projectKey}/decision/${id}`)
    .then((res) => {
      notification.open({
        message: "Decision deleted",
      });
      if (deleteCallback && typeof deleteCallback === "function") {
        deleteCallback();
      }
    });
};

const DecisionTag = ({ decision, deleteCallback, projectKey, user }) => {
  if (!_.get(decision, "mode")) {
    return "";
  } else if (["block", "ignore"].includes(_.get(decision, "mode"))) {
    return (
      <Tooltip title={_.get(decision, "mode")}>
        {" "}
        <Tag
          closable={canEditDataset({ key: projectKey }, user)}
          onClose={() =>
            deleteDecision(_.get(decision, "id"), deleteCallback, projectKey)
          }
          className="decision-tag"
        >
          {_.get(decision, "mode").substring(0, 2)}...
        </Tag>
      </Tooltip>
    );
  } else if (_.get(decision, "status")) {
    return (
      <Tooltip title={_.get(decision, "status")}>
        <Tag
          closable
          onClose={() =>
            deleteDecision(_.get(decision, "id"), deleteCallback, projectKey)
          }
          className="decision-tag"
        >
          {_.get(decision, "status")
            ? `${decision.status.substring(0, 2)}...`
            : ""}
        </Tag>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip title="Update">
        <Tag
          closable
          onClose={() =>
            deleteDecision(_.get(decision, "id"), deleteCallback, projectKey)
          }
          className="decision-tag"
        >
          up...
        </Tag>
      </Tooltip>
    );
  }
};

const mapContextToProps = ({ user }) => ({
  user,
});

export default withContext(mapContextToProps)(DecisionTag);
