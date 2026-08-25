import React from "react";
import { Tag, Tooltip } from "antd";
import _ from "lodash";
import { JOB_STATUS } from "../../api/job";

/**
 * The single colour map for the unified job lifecycle.
 *
 * Before the unified job API every table carried its own copy of this map,
 * keyed on the fine grained IMPORTSTATE. There are only six statuses now, and
 * the fine grained stage lives in the free text `step`.
 */
export const STATUS_COLOR = {
  [JOB_STATUS.WAITING]: "orange",
  [JOB_STATUS.BLOCKED]: "gold",
  [JOB_STATUS.RUNNING]: "blue",
  [JOB_STATUS.FINISHED]: "green",
  [JOB_STATUS.CANCELED]: "default",
  [JOB_STATUS.FAILED]: "red",
};

/**
 * `step` is free text. Most jobs report a single lower cased word derived from
 * an enum ("inserting", "building_metrics"), but some report real prose with a
 * count ("scheduled 5 of 20"), so underscores become spaces and only the first
 * letter is capitalised - start casing every word would mangle those.
 *
 * @param status a JOBSTATUS value, lower cased as the API serializes it
 * @param step   the free text step of a running job, e.g. "inserting"
 * @param error  optional error message, shown as a tooltip on a failed job
 */
export const stepLabel = (step) =>
  step ? _.upperFirst(String(step).replace(/_+/g, " ")) : null;

const JobStatusTag = ({ status, step, error, style }) => {
  if (!status) return null;
  const s = String(status).toLowerCase();
  const tag = (
    <Tag color={STATUS_COLOR[s] || "default"} style={style}>
      {_.startCase(s)}
      {step ? ` · ${stepLabel(step)}` : ""}
    </Tag>
  );
  return error ? <Tooltip title={error}>{tag}</Tooltip> : tag;
};

export default JobStatusTag;
