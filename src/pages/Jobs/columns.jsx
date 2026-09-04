import React from "react";
import { Tooltip } from "antd";
import { NavLink } from "react-router-dom";
import { CodeOutlined } from "@ant-design/icons";
import { formatTime } from "../../dateTime";
import _ from "lodash";
import JobStatusTag from "../../components/job/JobStatusTag";
import JobDuration from "../../components/job/JobDuration";
import CancelJobButton from "../../components/job/CancelJobButton";
import { jobLogQuery } from "../../components/job/kibanaQuery";
import { humanSize } from "../../api/job";
import config from "../../config";

const dt = (date) => formatTime(date, "lll");

export const statusColumn = {
  title: "Status",
  key: "status",
  width: 180,
  render: (text, record) => (
    <JobStatusTag
      status={record.status}
      step={record.step}
      error={record.errorMessage}
    />
  ),
};

export const jobColumn = {
  title: "Job",
  key: "job",
  width: 160,
  render: (text, record) => record.job,
};

/**
 * Stop a free text column growing with the longest value it happens to hold.
 *
 * Both job tables scroll with x: "max-content", which sizes the table itself to
 * its content and so turns a column's declared `width` into a proportion rather
 * than a cap - a 70 character dataset title stretched that column to 499px and
 * pushed the date columns off screen. A max-width on the cell bounds what the
 * column contributes to that max-content total, so the column flexes with the
 * text it holds and stops at the cap; pair it with ellipsis to truncate.
 *
 * ellipsis would normally put the full text in the cell's title attribute, but
 * only for a plain string child. These cells render links, and the User column
 * is not repeated in the expanded row the way Dataset is, so carry the value
 * over here or truncating it would put it out of reach.
 */
const capped = (maxWidth, valueOf) => (record) => ({
  style: { maxWidth },
  title: valueOf(record) ?? undefined,
});

const datasetName = (record) =>
  record.dataset?.alias || record.dataset?.title || record.datasetKey;

export const datasetColumn = {
  title: "Dataset",
  key: "datasetKey",
  width: 220,
  ellipsis: true,
  onCell: capped(320, datasetName),
  render: (text, record) =>
    record.datasetKey ? (
      <NavLink
        to={{
          pathname:
            record.dataset?.origin === "project"
              ? `/project/${record.datasetKey}/metadata`
              : `/dataset/${record.datasetKey}/metadata`,
        }}
        end
      >
        {datasetName(record)}
      </NavLink>
    ) : null,
};

export const sectorColumn = {
  title: "Sector",
  key: "sectorKey",
  width: 90,
  render: (text, record) =>
    record.sectorKey && record.datasetKey ? (
      <NavLink
        to={{
          pathname: `/project/${record.datasetKey}/sector`,
          search: `?id=${record.sectorKey}`,
        }}
        end
      >
        {record.sectorKey}
      </NavLink>
    ) : (
      record.sectorKey
    ),
};

const userName = (record) => record.user?.username || record.userKey;

// 104px is eight characters plus an ellipsis at the table font, measured on
// the longest username in use. The ones that actually recur here - importer,
// matcher, a first name - stay whole; only the long ones abbreviate.
const USER_WIDTH = 104;

export const userColumn = {
  title: "User",
  key: "createdBy",
  width: USER_WIDTH,
  ellipsis: true,
  onCell: capped(USER_WIDTH, userName),
  render: (text, record) => userName(record),
};

export const priorityColumn = {
  title: "Priority",
  dataIndex: "priority",
  key: "priority",
  width: 90,
  render: (p) => _.startCase(p),
};

export const dateColumn = (title, field) => ({
  title,
  dataIndex: field,
  key: field,
  width: 165,
  render: dt,
});

export const durationColumn = {
  title: "Duration",
  key: "duration",
  width: 90,
  render: (text, record) => <JobDuration job={record} />,
};

export const resultColumn = {
  title: "Result",
  key: "result",
  width: 110,
  render: (text, record) =>
    record.result && !record.result.deleted ? (
      <a href={`${config.dataApi}job/${record.key}.zip`}>
        {humanSize(record.result.size) || "download"}
      </a>
    ) : null,
};

export const logsColumn = {
  title: "Logs",
  key: "logs",
  width: 60,
  render: (text, record) => (
    <Tooltip title="Logs">
      <a href={jobLogQuery(record.key)} target="_blank" rel="noreferrer">
        <CodeOutlined style={{ fontSize: "18px" }} />
      </a>
    </Tooltip>
  ),
};

export const actionColumn = (onChanged) => ({
  title: "",
  key: "action",
  width: 80,
  render: (text, record) => (
    <CancelJobButton job={record} onCancelled={onChanged} />
  ),
});
