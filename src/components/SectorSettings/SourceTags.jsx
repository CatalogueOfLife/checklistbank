import React from "react";
import { Tag, Tooltip } from "antd";
import { NavLink } from "react-router-dom";
import { parseSources } from "./settingsMeta";

const titleOf = (profiles, id) => profiles[id]?.title || `profile ${id}`;

// "Publisher sectors, Project defaults", each linking to where the profiles are listed
export const ProfileLinks = ({ ids, profiles = {}, profilesPath }) =>
  ids.map((id, i) => (
    <React.Fragment key={id}>
      {i > 0 && ", "}
      {profilesPath ? <NavLink to={profilesPath}>{titleOf(profiles, id)}</NavLink> : titleOf(profiles, id)}
    </React.Fragment>
  ));

// Marks an inherited value: a "profile" tag naming its profiles, or a "default" tag.
// A value the sector sets itself gets none.
const SourceTags = ({ source, profiles = {}, profilesPath }) => {
  const sources = parseSources(source);
  const ids = sources.filter((s) => s.type === "profile").map((s) => s.id);
  if (ids.length) {
    return (
      <Tooltip title={<>From <ProfileLinks ids={ids} profiles={profiles} /></>}>
        <Tag color="blue">{profilesPath ? <NavLink to={profilesPath}>profile</NavLink> : "profile"}</Tag>
      </Tooltip>
    );
  }
  return sources.every((s) => s.type === "default") ? <Tag>default</Tag> : null;
};

export default SourceTags;
