import React from "react";
import _ from "lodash";
import config from "../../config";
import axios from "axios";
import { Tooltip, Tag, App } from "antd";
import withContext from "../../components/hoc/withContext";

import Auth from "../../components/Auth";
const { canEditDataset } = Auth;

const DecisionTag = ({ decision, deleteCallback, projectKey, user }) => {
  const { notification } = App.useApp();

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
  // The tag itself is truncated to 2 characters, so the tooltip carries the
  // full decision label plus the curator's note when there is one.
  const tooltipTitle = (label) => {
    const note = _.get(decision, "note");
    return note ? (
      <>
        {label}
        <br />
        {note}
      </>
    ) : (
      label
    );
  };

  if (!_.get(decision, "mode")) {
    return "";
  } else if (["block", "ignore"].includes(_.get(decision, "mode"))) {
    return (
      <Tooltip title={tooltipTitle(_.get(decision, "mode"))}>
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
      <Tooltip title={tooltipTitle(_.get(decision, "status"))}>
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
      <Tooltip title={tooltipTitle("Update")}>
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
