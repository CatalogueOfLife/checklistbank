import React from "react";
import config from "../../config";

import {
  ArrowRightOutlined,
  CodeOutlined,
  FileZipOutlined,
  LoadingOutlined,
  DiffOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { RiNodeTree } from "react-icons/ri";

import { Timeline, Tooltip } from "antd";
import moment from "dayjs";
import { NavLink } from "react-router-dom";
import { datasetLogQuery as kibanaQuery } from "../../components/job/kibanaQuery";
import _ from "lodash";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { STATUS_COLOR } from "../../components/job/JobStatusTag";
import { isLive, isRunning } from "../../api/job";

const getDot = (h, attempt) => {
  if (isRunning(h.status)) {
    return <LoadingOutlined />;
  } else {
    return attempt && attempt === h.attempt.toString() ? (
      <ArrowRightOutlined />
    ) : null;
  }
};

const getPreviousFinishedImport = (importHistory, index) => {
  const prevHistory = importHistory.slice(index + 1);
  return _.get(
    prevHistory.filter((h) => h.status === "finished"),
    "[0].attempt"
  );
};

const ImportHistory = ({ importHistory, attempt, projectKey, origin }) => (
  <Timeline
    items={importHistory.map((h, index) => ({
      key: h.attempt,
      color: STATUS_COLOR[h.status],
      icon: getDot(h, attempt),
      content: (
        <>
          {/* While a job is still in flight the step ("inserting") is the useful
              detail. Once it is done the step only says where it stopped, so the
              state is what matters - a canceled import read as "inserting". */}
          {isLive(h.status) && <strong>{h.step || h.status}</strong>}
          {h.status === "finished" && (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/dataset/${h.datasetKey}/imports/${h.attempt}`,
                }}
                end
              >
                <strong>
                  {`${h.status}`}{" "}
                  {"upload" in h &&
                    (_.get(h, "upload") ? (
                      <UploadOutlined />
                    ) : (
                      <DownloadOutlined />
                    ))}
                </strong>
              </NavLink>
              {_.get(h, "user.username") && (
                <p>
                  {_.get(h, "upload") ? "Upload" : _.startCase(h.job)} by{" "}
                  {h.user.username}
                </p>
              )}
              <p>
                <span style={{ fontSize: "10px" }}>
                  {`${moment(h.started).format("lll")}`}{" "}
                </span>{" "}
                <Tooltip title={`Data Archive #${h.attempt}`} placement="right">
                  <a
                    href={`${config.dataApi}dataset/${h.datasetKey}/archive.zip?attempt=${h.attempt}`}
                    target="_blank"
                  >
                    <FileZipOutlined />
                  </a>{" "}
                </Tooltip>{" "}
                <Tooltip title={`TextTree #${h.attempt}`} placement="right">
                  <a
                    href={`${config.dataApi}dataset/${h.datasetKey}/import/${h.attempt}/tree`}
                    target="_blank"
                  >
                    <FileTextOutlined />
                  </a>{" "}
                </Tooltip>{" "}
                {origin === "project" && (
                  <Tooltip title={`Release files`} placement="right">
                    <a
                      href={`${config.downloadApi}releases/${h.datasetKey}/${h.attempt}`}
                      target="_blank"
                    >
                      <DownloadOutlined />
                    </a>{" "}
                  </Tooltip>
                )}
                {getPreviousFinishedImport(importHistory, index) && (
                  <Tooltip
                    title="Diff between this and previous attempt"
                    placement="right"
                  >
                    <NavLink
                      to={{
                        pathname: `/dataset/${h.datasetKey}/diff`,
                        search: `?attempts=${getPreviousFinishedImport(
                          importHistory,
                          index
                        )}..${h.attempt}`,
                      }}
                      end
                    >
                      <DiffOutlined />
                    </NavLink>{" "}
                  </Tooltip>
                )}
                <Tooltip title="Kibana logs" placement="right">
                  <a href={kibanaQuery(h.datasetKey, h.attempt)} target="_blank">
                    <CodeOutlined />
                  </a>
                </Tooltip>{" "}
                <Tooltip title="Browse archived tree" placement="right">
                  <NavLink
                    to={{
                      pathname: `/dataset/${h.datasetKey}/imports/${h.attempt}/tree`,
                    }}
                    end
                  >
                    <RiNodeTree />
                  </NavLink>
                </Tooltip>
              </p>
            </React.Fragment>
          )}

          {["failed", "canceled"].includes(h.status) && (
            <React.Fragment>
              <NavLink
                to={{
                  pathname: `/dataset/${h.datasetKey}/imports/${h.attempt}`,
                }}
                end
              >
                <strong>{`${h.status}`}</strong>
              </NavLink>{" "}
              <Tooltip title={`Data Archive #${h.attempt}`} placement="right">
                <a
                  href={`${config.dataApi}dataset/${h.datasetKey}/archive.zip?attempt=${h.attempt}`}
                  target="_blank"
                >
                  <FileZipOutlined />
                </a>{" "}
              </Tooltip>
              <Tooltip title="Kibana logs" placement="right">
                <a href={kibanaQuery(h.datasetKey, h.attempt)} target="_blank">
                  <CodeOutlined />
                </a>
              </Tooltip>
              {_.get(h, "user.username") && <p>Created by {h.user.username}</p>}
              <p style={{ fontSize: "10px" }}>{`${moment(h.started).format(
                "lll"
              )}`}</p>
              {h?.error?.length && (
                <p>
                  {h.error.length > 200
                    ? `${h.error.substring(0, 200)} .....`
                    : h.error}
                </p>
              )}
            </React.Fragment>
          )}
        </>
      ),
    }))}
  />
);

export default ImportHistory;
