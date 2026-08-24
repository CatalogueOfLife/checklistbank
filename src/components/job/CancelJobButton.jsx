import React, { useState } from "react";
import { Button, Popconfirm, App } from "antd";
import { cancelJob, isLive } from "../../api/job";
import withContext from "../hoc/withContext";
import Auth from "../Auth";

/**
 * Cancels any background job through DELETE /job/{key}.
 *
 * The backend allows the owner or an admin, and 404s once a job has left the
 * executor, so the button only shows for jobs that are still queued or running.
 */
const CancelJobButton = ({ job, user, onCancelled, size = "small" }) => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);

  if (!job || !isLive(job.status)) return null;
  const mine = user && job.userKey === user.key;
  if (!mine && !Auth.isAuthorised(user, ["admin"])) return null;

  const cancel = async () => {
    setLoading(true);
    try {
      await cancelJob(job.key);
      notification.open({
        message: "Job cancelled",
        description: `${job.label || job.job} ${job.key}`,
      });
      if (onCancelled) onCancelled();
    } catch (err) {
      notification.error({
        message: "Could not cancel job",
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm
      title="Cancel this job?"
      onConfirm={cancel}
      okText="Yes"
      cancelText="No"
    >
      <Button danger size={size} loading={loading}>
        Stop
      </Button>
    </Popconfirm>
  );
};

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(CancelJobButton);
