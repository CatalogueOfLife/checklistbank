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
import moment from "moment";
import { NavLink } from "react-router-dom";
import kibanaQuery from "../Imports/importTabs/kibanaQuery";
import _ from "lodash";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";

const tagColors = {
  processing: "purple",
  downloading: "cyan",
  inserting: "blue",
  finished: "green",
  failed: "red",
  "in queue": "orange",
};

const getDot = (h, attempt) => {
  if (
    ["processing", "downloading", "inserting", "analyzing"].includes(h.state)
  ) {
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
    prevHistory.filter((h) => h.state === "finished"),
    "[0].attempt"
  );
};

const ImportHistory = ({ importHistory, attempt, catalogueKey, origin }) => (
  <Timeline>
    {importHistory.map((h, index) => (
      <Timeline.Item
        key={h.attempt}
        color={tagColors[h.state]}
        dot={getDot(h, attempt)}
      >
        {["finished", "failed", "unchanged"].indexOf(h.state) === -1 && (
          <strong>{h.state}</strong>
        )}
        {h.state === "finished" && (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${h.datasetKey}/imports/${h.attempt}`,
              }}
              exact={true}
            >
              <strong>
                {`${h.state}`}{" "}
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
                    exact={true}
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
                  exact={true}
                >
                  <RiNodeTree />
                </NavLink>
              </Tooltip>
            </p>
          </React.Fragment>
        )}

        {h.state === "failed" && (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${h.datasetKey}/imports/${h.attempt}`,
              }}
              exact={true}
            >
              <strong>{`${h.state}`}</strong>
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
            <p>
              {h.error.length > 200
                ? `${h.error.substring(0, 200)} .....`
                : h.error}
            </p>
          </React.Fragment>
        )}
      </Timeline.Item>
    ))}
  </Timeline>
);

export default ImportHistory;
