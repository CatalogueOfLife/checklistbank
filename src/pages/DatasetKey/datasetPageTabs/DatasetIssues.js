import { useState, useEffect } from "react";
import { LinkOutlined } from "@ant-design/icons";
import { Table, Alert, Tag, Tooltip } from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import MultiValueFilter from "../../NameSearch/MultiValueFilter";
import _ from "lodash";

// Issues that don't appear in the nameusage/search index — link to verbatim only.
const NON_NAMEUSAGE_ISSUES = new Set([
  "not interpreted",
  "name id invalid",
  "accepted name missing",
]);

const getColumns = ({ issueMap, projectKey }) => {
  return [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        return (
          <Tooltip
            key={text}
            placement="right"
            title={_.get(issueMap, `[${text}].description`)}
          >
            <Tag key={text} color={_.get(issueMap, `[${text}].color`)}>
              {_.startCase(text)}
            </Tag>
            <NavLink
              to={{
                pathname: `/dataset/${record.datasetKey}/verbatim`,
                search: `?issue=${text}`,
              }}
              end
            >
              {" "}
              verbatim <LinkOutlined />
            </NavLink>
          </Tooltip>
        );
      },
      width: 250,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      render: (text, record) => {
        if (NON_NAMEUSAGE_ISSUES.has(record.title)) {
          return text;
        }
        return (
          <NavLink
            to={{
              pathname: `/dataset/${record.datasetKey}/names`,
              search: `?issue=${record.title}`,
            }}
            end
          >
            {text}
          </NavLink>
        );
      },
      width: 250,
      defaultSortOrder: "descend",
      sorter: (a, b) => a.count - b.count,
    },
  ];
};

const DatasetIssues = (props) => {
  const { datasetKey, issue, issueMap } = props;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(null);

  const getData = () => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset/${datasetKey}/import?limit=3&state=finished`
    )
      .then((res) => {
        let tableData = [];
        _.each(_.get(res, "data[0].issuesCount"), (v, k) => {
          tableData.push({
            title: k,
            count: v,
            datasetKey: datasetKey,
          });
        });
        setLoading(false);
        setData(tableData);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData({});
      });
  };

  useEffect(() => {
    getData();
  }, []);

  const updateSelectedGroups = (groups) => {
    if (groups && groups.length > 0) {
      localStorage.setItem(
        "col_plus_selected_issue_groups",
        JSON.stringify(groups)
      );
    } else if (groups && groups.length === 0) {
      localStorage.removeItem("col_plus_selected_issue_groups");
    }
    setSelectedGroups(groups);
  };

  const groups = issue
    ? issue
        .filter(
          (e, i) => issue.findIndex((a) => a["group"] === e["group"]) === i
        )
        .map((a) => a.group)
    : [];
  const resolvedSelectedGroups = selectedGroups !== null
    ? selectedGroups
    : localStorage.getItem("col_plus_selected_issue_groups")
    ? JSON.parse(localStorage.getItem("col_plus_selected_issue_groups"))
    : [...groups];
  let groupMap = {};
  if (issue) {
    issue.forEach((i) => {
      groupMap[i.name] = i.group;
    });
  }
  const columns = issueMap ? getColumns(props) : [];

  return (
    <PageContent>
      {error && <Alert title={error.message} type="error" />}
      <MultiValueFilter
        defaultValue={
          resolvedSelectedGroups && resolvedSelectedGroups.length > 0
            ? resolvedSelectedGroups
            : groups
        }
        onChange={updateSelectedGroups}
        vocab={groups}
        label="Issue groups"
      />

      {!error && (
        <Table
          size="middle"
          columns={columns}
          dataSource={
            resolvedSelectedGroups && data
              ? data.filter((d) => resolvedSelectedGroups.includes(groupMap[d.title]))
              : data
          }
          loading={loading}
          pagination={false}
          rowKey="title"
        />
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ user, issue, issueMap, projectKey }) => ({
  user,
  issue,
  issueMap,
  projectKey,
});

export default withContext(mapContextToProps)(DatasetIssues);
