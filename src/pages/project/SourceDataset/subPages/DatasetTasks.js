import React from "react";
import { Alert, Tag, Card, Spin, message } from "antd";
import axios from "axios";
import config from "../../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../../components/PageContent";
import withContext from "../../../../components/hoc/withContext";
import { getDuplicateOverview } from "../../../../api/dataset";
import ErrorMsg from "../../../../components/ErrorMsg";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined } from "@ant-design/icons";
const _ = require("lodash");

class DatasetTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      duplicates: [],
      duplicatesWithdecision: [],
      manuscriptNames: null,
      staleDecisions: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.getData();
    this.getManusciptNames();
    this.getBrokenDecisions();
    this.getStaleDecisions();
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "datasetKey") !== _.get(this.props, "datasetKey") ||
      _.get(prevProps, "projectKey") !== _.get(this.props, "projectKey")
    ) {
      this.getData();
      this.getManusciptNames();
      this.getBrokenDecisions();
      this.getStaleDecisions();
    }
  };

  getData = async () => {
    const { datasetKey, projectKey } = this.props;

    this.setState({ loading: true });
    const duplicatesWithNodecision = await getDuplicateOverview({
      datasetKey,
      projectKey,
      withDecision: false,
    });
    const duplicatesWithdecision = await getDuplicateOverview({
      datasetKey,
      projectKey,
      withDecision: true,
    });
    let completedMap = {};
    duplicatesWithdecision.forEach((c) => {
      completedMap[c.id] = { count: c.count, error: c.error };
    });
    const duplicates = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      completed: completedMap[d.id].count,
      error: d.error || completedMap[d.id].error,
    }));
    this.setState({ duplicates: duplicates, loading: false });
  };

  getManusciptNames = () => {
    const { datasetKey, projectKey } = this.props;
    Promise.all([
      axios(
        `${config.dataApi}dataset/${datasetKey}/nameusage/search?projectKey=${projectKey}&nomstatus=manuscript&limit=0`
      ).then((res) => {
        return res.data.total;
      }),
      axios(
        `${config.dataApi}dataset/${datasetKey}/nameusage/search?projectKey=${projectKey}&nomstatus=manuscript&limit=0&decisionMode=_NOT_NULL`
      ).then((res) => {
        return res.data.total;
      }),
    ]).then((values) =>
      this.setState({
        manuscriptNames: { count: values[0], completed: values[1] },
      })
    );
  };

  getBrokenDecisions = () => {
    const { datasetKey, projectKey } = this.props;
    axios(
      `${config.dataApi}dataset/${projectKey}/decision?subjectDatasetKey=${datasetKey}&broken=true&limit=0`
    ).then((res) => this.setState({ brokenDecisions: res.data.total }));
  };

  getStaleDecisions = () => {
    const { datasetKey, projectKey } = this.props;
    axios(
      `${config.dataApi}dataset/${projectKey}/decision/stale?subjectDatasetKey=${datasetKey}`
    ).then((res) => {
      this.setState({
        staleDecisions: { count: res.data.total },
      });
    });
  };

  render() {
    const {
      error,
      duplicates,
      manuscriptNames,
      loading,
      brokenDecisions,
      staleDecisions,
    } = this.state;
    const { getDuplicateWarningColor, datasetKey, projectKey } = this.props;

    return (
      <PageContent>
        {error && (
          <Alert description={<ErrorMsg error={error} />} type="error" />
        )}
        {duplicates
          .filter((d) => d.error)
          .map((d) => (
            <Alert
              style={{ marginTop: "8px" }}
              description={<ErrorMsg error={d.error} />}
              type="error"
            />
          ))}
        <Card>
          <h1>Duplicates without decision</h1>
          {loading && <Spin />}
          {duplicates
            .filter((d) => !d.error)
            .map((d) => (
              <Tag
                key={d.id}
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(d.count)}
              >
                <NavLink
                  to={{
                    pathname: `/project/${projectKey}/dataset/${datasetKey}/duplicates`,
                    search: `?_colCheck=${d.id}`,
                  }}
                  exact={true}
                >
                  {d.text}{" "}
                  {
                    <strong>{`${d.completed} of ${
                      d.completed + d.count
                    }`}</strong>
                  }
                </NavLink>{" "}
                <CopyToClipboard
                  text={d.text}
                  onCopy={() => message.info(`Copied "${d.text}" to clipboard`)}
                >
                  <CopyOutlined />
                </CopyToClipboard>
              </Tag>
            ))}

          <h1>Manuscript names without decision</h1>
          {manuscriptNames && (
            <Tag
              style={{ marginBottom: "10px" }}
              color={getDuplicateWarningColor(manuscriptNames.count)}
            >
              <NavLink
                to={{
                  pathname: `/project/${projectKey}/dataset/${datasetKey}/workbench`,
                  search: `?nomstatus=manuscript&limit=50`,
                }}
                exact={true}
              >
                Manuscript names{" "}
                {
                  <strong>{`${manuscriptNames.completed} of ${manuscriptNames.count}`}</strong>
                }
              </NavLink>
            </Tag>
          )}
          <h1>Broken decisions</h1>
          {brokenDecisions && (
            <Tag
              style={{ marginBottom: "10px" }}
              color={getDuplicateWarningColor(brokenDecisions)}
            >
              <NavLink
                to={{
                  pathname: `/project/${projectKey}/decision`,
                  search: `?broken=true&limit=100&offset=0&subjectDatasetKey=${datasetKey}`,
                }}
                exact={true}
              >
                Broken decisions: {<strong>{`${brokenDecisions}`}</strong>}
              </NavLink>
            </Tag>
          )}
          <h1>Outdated decisions</h1>
          {staleDecisions && (
            <NavLink
              to={{
                pathname: `/project/${projectKey}/decision`,
                search: `?stale=true&subjectDatasetKey=${datasetKey}`,
              }}
              exact={true}
            >
              <Tag
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(staleDecisions.count)}
              >
                Outdated decisions (<strong>{`${staleDecisions.count}`}</strong>
                )
              </Tag>
            </NavLink>
          )}
        </Card>
      </PageContent>
    );
  }
}

const mapContextToProps = ({
  user,
  issue,
  issueMap,
  getDuplicateWarningColor,
  projectKey,
}) => ({ user, issue, issueMap, getDuplicateWarningColor, projectKey });

export default withContext(mapContextToProps)(DatasetTasks);
