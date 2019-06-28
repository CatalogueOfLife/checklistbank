import React from "react";
import { Table, Alert, Tag, Card, Tooltip, Icon , Spin} from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import MultiValueFilter from "../../NameSearch/MultiValueFilter";
import { getDuplicateOverview } from "../../../api/dataset";

const _ = require("lodash");

class DatasetTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = { duplicates: [], loading: false };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { datasetKey, issueMap } = this.props;

    this.setState({ loading: true });
    getDuplicateOverview(datasetKey).then(res =>
      this.setState({ duplicates: res, loading: false })
    );
  };

  updateSelectedGroups = groups => {
    if (groups && groups.length > 0) {
      localStorage.setItem(
        "col_plus_selected_issue_groups",
        JSON.stringify(groups)
      );
    } else if (groups && groups.length === 0) {
      localStorage.removeItem("col_plus_selected_issue_groups");
    }
    this.setState({ selectedGroups: groups });
  };

  render() {
    const { error, duplicates, loading } = this.state;
    const {
      issue,
      issueMap,
      getDuplicateWarningColor,
      datasetKey
    } = this.props;
    const groups = issue
      ? issue
          .filter(
            (e, i) => issue.findIndex(a => a["group"] === e["group"]) === i
          )
          .map(a => a.group)
      : [];
    const selectedGroups = localStorage.getItem(
      "col_plus_selected_issue_groups"
    )
      ? JSON.parse(localStorage.getItem("col_plus_selected_issue_groups"))
      : [...groups];
    let groupMap = {};
    if (issue) {
      issue.forEach(i => {
        groupMap[i.name] = i.group;
      });
    }

    return (
      <PageContent>
        {error && <Alert message={error.message} type="error" />}
        <Card>
        <h1>Duplicates without decision</h1>
        {loading && <Spin />}
        {duplicates
          .filter(d => d.count > 50)
          .map(d => (
            <NavLink
              to={{ pathname: `/dataset/${datasetKey}/duplicates`, search:`?_colCheck=${d.id}` }}
              exact={true}
            >
              <Tag
                key={d.id}
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(d.count)}
              >
                {d.text} {<strong>> 50</strong>}
              </Tag>{" "}
            </NavLink>
          ))}
        {duplicates
          .filter(d => d.count < 51 && d.count > 0)
          .map(d => (
            <NavLink
            to={{ pathname: `/dataset/${datasetKey}/duplicates` , search:`?_colCheck=${d.id}` }}
            exact={true}
          >
            <Tag
              key={d.id}
              style={{ marginBottom: "10px" }}
              color={getDuplicateWarningColor(d.count)}
            >
              {d.text} {<strong>{d.count}</strong>}
            </Tag></NavLink>
          ))}
        {duplicates
          .filter(d => d.count === 0)
          .map(d => (
            <NavLink
            to={{ pathname: `/dataset/${datasetKey}/duplicates` , search:`?_colCheck=${d.id}` }}
            exact={true}
          >
            <Tag
              key={d.id}
              style={{ marginBottom: "10px" }}
              color={getDuplicateWarningColor(d.count)}
            >
              {d.text} {<strong>{d.count}</strong>}
            </Tag></NavLink>
          ))}
                      </Card>

      </PageContent>
    );
  }
}

const mapContextToProps = ({
  user,
  issue,
  issueMap,
  getDuplicateWarningColor
}) => ({ user, issue, issueMap, getDuplicateWarningColor });

export default withContext(mapContextToProps)(DatasetTasks);
