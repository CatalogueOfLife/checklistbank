import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { isRunning } from "../../api/job";
import { parseTime } from "../../dateTime";

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
  // parseTime, not dayjs - `now` is a true epoch, so a naive-UTC `started`
  // parsed as local time would inflate a running job by the viewer's offset
  const end = finished ? parseTime(finished).valueOf() : now;
  return <>{format(end - parseTime(started).valueOf())}</>;
};

export default JobDuration;
