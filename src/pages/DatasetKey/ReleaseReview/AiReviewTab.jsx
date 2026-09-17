import { useState, useEffect, useRef } from "react";
import { Alert, Button, Descriptions, Popconfirm, Row, Space, Spin, Tag } from "antd";
import { RobotOutlined, LinkOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../../config";
import Auth from "../../../components/Auth";
import withContext from "../../../components/hoc/withContext";
import { formatTime } from "../../../dateTime";

const STATUS_COLOR = {
  NONE: "default",
  RUNNING: "blue",
  FINISHED: "green",
  FAILED: "red",
};

/**
 * Requests and shows the agentic Claude review of this release.
 *
 * A release is only ever reviewed once: when a report exists the backend
 * refuses a second run and this tab links the existing report.
 */
const AiReviewTab = ({ datasetKey, review, loadError, reload, dataset, user }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const timerRef = useRef(null);
  const error = submitError || loadError;

  const status = review?.status || "NONE";
  const mayRequest = Auth.canEditProjectOf(dataset, user);

  // Poll while the job runs - a review takes minutes, not seconds.
  useEffect(() => {
    if (status === "RUNNING") {
      if (!timerRef.current) {
        timerRef.current = setInterval(reload, config.pollingHeartBeat || 5000);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, reload]);

  const request = (force) => {
    setSubmitting(true);
    axios
      .post(
        `${config.dataApi}dataset/${datasetKey}/review${force ? "?force=true" : ""}`
      )
      .then(() => {
        setSubmitError(null);
        return reload();
      })
      .catch(setSubmitError)
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      {error && (
        <Alert
          title={error?.response?.data?.message || error.message}
          type="error"
          style={{ marginBottom: "8px" }}
        />
      )}
      <Descriptions
        bordered
        size="small"
        column={1}
        items={[
          {
            key: "status",
            label: "Status",
            children: (
              <Space>
                <Tag color={STATUS_COLOR[status]}>{status}</Tag>
                {status === "RUNNING" && <Spin size="small" />}
              </Space>
            ),
          },
          ...(review?.reportURI
            ? [
                {
                  key: "report",
                  label: "Report",
                  children: (
                    <a
                      href={review.reportURI}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {review.reportURI} <LinkOutlined />
                    </a>
                  ),
                },
              ]
            : []),
          ...(review?.model
            ? [{ key: "model", label: "Model", children: review.model }]
            : []),
          ...(review?.started
            ? [
                {
                  key: "started",
                  label: "Started",
                  children: formatTime(review.started, "LLL"),
                },
              ]
            : []),
          ...(review?.finished
            ? [
                {
                  key: "finished",
                  label: "Finished",
                  children: formatTime(review.finished, "LLL"),
                },
              ]
            : []),
          ...(review?.listCost
            ? [{ key: "cost", label: "Cost", children: review.listCost }]
            : []),
          ...(review?.error
            ? [{ key: "error", label: "Error", children: review.error }]
            : []),
        ]}
      />
      {mayRequest && (
        <Row style={{ marginTop: "16px" }}>
          {status === "NONE" && (
            <Popconfirm
              title="Start an AI review of this release? This calls the Anthropic API and costs money."
              onConfirm={() => request(false)}
              okText="Start review"
            >
              <Button type="primary" icon={<RobotOutlined />} loading={submitting}>
                Request AI review
              </Button>
            </Popconfirm>
          )}
          {status === "FAILED" && (
            <Button
              icon={<RobotOutlined />}
              loading={submitting}
              onClick={() => request(true)}
            >
              Retry AI review
            </Button>
          )}
          {status === "FINISHED" && Auth.isAdmin(user) && (
            <Popconfirm
              title="This release has been reviewed already. Run another review anyway?"
              onConfirm={() => request(true)}
              okText="Review again"
            >
              <Button danger loading={submitting}>
                Review again
              </Button>
            </Popconfirm>
          )}
        </Row>
      )}
    </>
  );
};

const mapContextToProps = ({ user }) => ({ user });
export default withContext(mapContextToProps)(AiReviewTab);
