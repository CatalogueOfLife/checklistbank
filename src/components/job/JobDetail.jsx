import React, { useState, useEffect } from "react";
import { Spin, Alert, Typography } from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import PresentationItem from "../PresentationItem";
import JobStatusTag from "./JobStatusTag";
import JobDuration from "./JobDuration";
import { getJob } from "../../api/job";
import { jobLogQuery } from "./kibanaQuery";
import config from "../../config";

const { Paragraph } = Typography;

const JsonBlock = ({ label, value }) => (
  <PresentationItem label={label}>
    <pre style={{ background: "#f5f5f5", padding: 8, overflow: "auto" }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  </PresentationItem>
);

const dt = (v) => (v ? dayjs(v).format("lll") : null);

const humanSize = (bytes) => {
  if (!bytes && bytes !== 0) return null;
  const units = ["B", "kB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

/**
 * Detail view of a single background job, of any kind.
 *
 * Takes either an already loaded (normalized) job or a job key to fetch.
 * GET /job/{key} answers with the live BackgroundJob while a job is still in
 * the executor and with the persisted JobInfo afterwards; normalizeJob in
 * src/api/job.js flattens both, so nothing here has to care which it got.
 */
const JobDetail = ({ job: initial, jobKey }) => {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(initial || null);
  const [error, setError] = useState(null);
  const key = jobKey || initial?.key;

  useEffect(() => {
    if (initial || !key) return;
    setLoading(true);
    getJob(key)
      .then((j) => {
        setJob(j);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [key]);

  if (loading) return <Spin />;
  if (error)
    return (
      <Alert
        type="error"
        message={error?.response?.data?.message || error.message}
      />
    );
  if (!job) return null;

  return (
    <>
      <PresentationItem label="Status">
        <JobStatusTag status={job.status} step={job.step} />
      </PresentationItem>
      <PresentationItem label="Job">
        {job.label} <code>{job.job}</code>
      </PresentationItem>
      <PresentationItem label="Key">
        <code>{job.key}</code>
      </PresentationItem>
      <PresentationItem label="Lane">{_.startCase(job.lane)}</PresentationItem>
      <PresentationItem label="Priority">
        {_.startCase(job.priority)}
      </PresentationItem>
      {job.datasetKey && (
        <PresentationItem label="Dataset">{job.datasetKey}</PresentationItem>
      )}
      {job.sectorKey && (
        <PresentationItem label="Sector">{job.sectorKey}</PresentationItem>
      )}
      <PresentationItem label="Created">{dt(job.created)}</PresentationItem>
      <PresentationItem label="Started">{dt(job.started)}</PresentationItem>
      <PresentationItem label="Finished">{dt(job.finished)}</PresentationItem>
      <PresentationItem label="Duration">
        <JobDuration job={job} />
      </PresentationItem>
      {job.result && (
        <PresentationItem label="Result">
          <a href={`${config.dataApi}job/${job.key}.zip`}>
            Download{job.result.size ? ` (${humanSize(job.result.size)})` : ""}
          </a>
          {job.result.deleted && ` — deleted ${dt(job.result.deleted)}`}
        </PresentationItem>
      )}
      <PresentationItem label="Logs">
        <a href={jobLogQuery(job.key)} target="_blank" rel="noreferrer">
          Kibana
        </a>
      </PresentationItem>
      {job.errorMessage && (
        <PresentationItem label="Error">
          <Alert type="error" message={job.errorMessage} />
          {job.errorStackTrace && (
            <Paragraph>
              <pre style={{ overflow: "auto", maxHeight: 300 }}>
                {job.errorStackTrace}
              </pre>
            </Paragraph>
          )}
        </PresentationItem>
      )}
      {job.params && <JsonBlock label="Parameters" value={job.params} />}
    </>
  );
};

export default JobDetail;
