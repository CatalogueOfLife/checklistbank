import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { isRunning } from "../../api/job";

const format = (ms) => {
  if (!isFinite(ms) || ms < 0) return null;
  const d = dayjs.duration(ms);
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${d.minutes()}m ${d.seconds()}s`;
  const hours = Math.floor(d.asHours());
  return `${hours}h ${d.minutes()}m`;
};

/**
 * How long a job ran, or has been running. A running job ticks once a second
 * so the queue view does not look frozen between polls.
 */
const JobDuration = ({ job }) => {
  const started = job?.started;
  const finished = job?.finished;
  const live = isRunning(job?.status) && started && !finished;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  if (!started) return null;
  const end = finished ? dayjs(finished).valueOf() : now;
  return <>{format(end - dayjs(started).valueOf())}</>;
};

export default JobDuration;
