import React, { useState, useEffect } from "react";
import { Spin, Alert } from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import PresentationItem from "../PresentationItem";
import JobStatusTag from "./JobStatusTag";
import JobDuration from "./JobDuration";
import { getJob, humanSize } from "../../api/job";
import { formatTime } from "../../dateTime";
import { jobLogQuery } from "./kibanaQuery";
import config from "../../config";

const JsonBlock = ({ label, value }) => (
  <PresentationItem label={label}>
    <pre style={{ background: "#f5f5f5", padding: 8, overflow: "auto" }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  </PresentationItem>
);

const dt = (v) => formatTime(v, "lll");

/**
 * Detail view of a single background job, of any kind.
 *
 * Takes either an already loaded (normalized) job or a job key to fetch.
 * The stack trace of a failed job is not part of JobInfo - it lives in the job
 * log, reachable from the Kibana link below.
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
        <code>{job.job}</code>
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
      {job.attempt && (
        <PresentationItem label="Attempt">
          {/* an import or release attempt has a metrics page of its own; a sync attempt
              only exists inside the sector's sync history, so it stays plain text */}
          {job.datasetKey && !job.sectorKey ? (
            <NavLink to={`/dataset/${job.datasetKey}/imports/${job.attempt}`} end>
              {job.attempt}
            </NavLink>
          ) : (
            job.attempt
          )}
        </PresentationItem>
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
        </PresentationItem>
      )}
      {job.params && <JsonBlock label="Parameters" value={job.params} />}
    </>
  );
};

export default JobDetail;
