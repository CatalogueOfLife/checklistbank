import { useState, useEffect } from "react";
import { Alert, Checkbox, Row, Col, Spin, Table, Tag, Tooltip } from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import _ from "lodash";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import { NON_NAMEUSAGE_ISSUES } from "../datasetPageTabs/DatasetIssues";
import { compareIssues } from "./issues";

// Issues of a release live on the import metrics of the project attempt the
// release points at - asking the release for its import returns exactly that.
const getIssues = (key) =>
  axios(`${config.dataApi}dataset/${key}/import?limit=1`).then((res) =>
    _.get(res, "data[0].issuesCount")
  );

const countLink = (key, issue, count) => {
  if (!key) return count;
  const pathname = NON_NAMEUSAGE_ISSUES.has(issue)
    ? `/dataset/${key}/verbatim`
    : `/dataset/${key}/names`;
  return (
    <NavLink to={{ pathname, search: `?issue=${issue}` }} end>
      {count.toLocaleString()}
    </NavLink>
  );
};

const formatChange = (record) => {
  if (record.previousCount === 0) return "new";
  if (record.count === 0) return "gone";
  return `${record.change > 0 ? "+" : ""}${(record.change * 100).toFixed(1)} %`;
};

const IssuesTab = ({ datasetKey, previousReleaseKey, issueMap }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hideUnchanged, setHideUnchanged] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getIssues(datasetKey), getIssues(previousReleaseKey)])
      .then(([current, previous]) => {
        if (cancelled) return;
        setData(compareIssues(current, previous));
        setError(null);
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [datasetKey, previousReleaseKey]);

  const columns = [
    {
      title: "Issue",
      dataIndex: "issue",
      key: "issue",
      render: (issue) => (
        <Tooltip
          placement="right"
          title={_.get(issueMap, `[${issue}].description`)}
        >
          <Tag color={_.get(issueMap, `[${issue}].color`)} variant="outlined">
            {issue}
          </Tag>
        </Tooltip>
      ),
      sorter: (a, b) => a.issue.localeCompare(b.issue),
    },
    {
      title: "Previous release",
      dataIndex: "previousCount",
      key: "previousCount",
      render: (count, record) =>
        countLink(previousReleaseKey, record.issue, count),
      sorter: (a, b) => a.previousCount - b.previousCount,
    },
    {
      title: "This release",
      dataIndex: "count",
      key: "count",
      render: (count, record) => countLink(datasetKey, record.issue, count),
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: "Change",
      dataIndex: "delta",
      key: "delta",
      defaultSortOrder: "descend",
      sorter: (a, b) => Math.abs(a.delta) - Math.abs(b.delta),
      render: (delta, record) => (
        <span style={{ color: delta > 0 ? "#cf1322" : delta < 0 ? "#389e0d" : undefined }}>
          {delta > 0 ? "+" : ""}
          {delta.toLocaleString()} ({formatChange(record)})
        </span>
      ),
    },
  ];

  const rows = hideUnchanged ? (data || []).filter((r) => r.delta !== 0) : data;

  return (
    <>
      {error && <Alert title={error.message} type="error" />}
      <Row style={{ marginBottom: "8px" }}>
        <Col flex="auto" />
        <Col>
          <Checkbox
            checked={hideUnchanged}
            onChange={(e) => setHideUnchanged(e.target.checked)}
          >
            Hide unchanged
          </Checkbox>
        </Col>
      </Row>
      {loading && !data ? (
        <Row justify="center">
          <Spin />
        </Row>
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={rows || []}
          loading={loading}
          pagination={false}
          rowKey="issue"
        />
      )}
    </>
  );
};

const mapContextToProps = ({ issueMap }) => ({ issueMap });
export default withContext(mapContextToProps)(IssuesTab);
