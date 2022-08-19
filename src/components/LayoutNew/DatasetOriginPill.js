import React from "react";
import Auth from "../Auth";
import { NavLink } from "react-router-dom";
import { Tag } from "antd";
import withContext from "../../components/hoc/withContext";

const { canViewDataset } = Auth;

const DatasetOriginPill = ({ user, dataset }) => {
  if (dataset?.origin === "project") {
    return canViewDataset(dataset, user) ? (
      <NavLink to={{ pathname: `/catalogue/${dataset?.key}/assembly` }}>
        <Tag>Project</Tag>
      </NavLink>
    ) : (
      <Tag>Project</Tag>
    );
  } else if (dataset?.origin === "released") {
    return (
      <NavLink to={{ pathname: `/dataset/${dataset?.key}` }}>
        <Tag>Release</Tag>
      </NavLink>
    );
  } else {
    return null;
  }
};

const mapContextToProps = ({ user }) => ({
  user,
});

export default withContext(mapContextToProps)(DatasetOriginPill);
