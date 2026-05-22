import { useState, useEffect } from "react";
import { Alert, Tag, Card, Spin, App } from "antd";
import axios from "axios";
import config from "../../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../../components/PageContent";
import withContext from "../../../../components/hoc/withContext";
import { getDuplicateOverview } from "../../../../api/dataset";
import ErrorMsg from "../../../../components/ErrorMsg";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined } from "@ant-design/icons";
import _ from "lodash";

const DatasetTasks = (props) => {
  const { datasetKey, projectKey, getDuplicateWarningColor } = props;
  const { message } = App.useApp();

  const [duplicates, setDuplicates] = useState([]);
  const [manuscriptNames, setManuscriptNames] = useState(null);
  const [staleDecisions, setStaleDecisions] = useState(null);
  const [brokenDecisions, setBrokenDecisions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getData = async () => {
    setLoading(true);
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
    const newDuplicates = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      completed: completedMap[d.id].count,
      error: d.error || completedMap[d.id].error,
    }));
    setDuplicates(newDuplicates);
    setLoading(false);
  };

  const getManusciptNames = () => {
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
      setManuscriptNames({ count: values[0], completed: values[1] })
    );
  };

  const getBrokenDecisions = () => {
    axios(
      `${config.dataApi}dataset/${projectKey}/decision?subjectDatasetKey=${datasetKey}&broken=true&limit=0`
    ).then((res) => setBrokenDecisions(res.data.total));
  };

  const getStaleDecisions = () => {
    axios(
      `${config.dataApi}dataset/${projectKey}/decision/stale?subjectDatasetKey=${datasetKey}`
    ).then((res) => {
      setStaleDecisions({ count: res.data.total });
    });
  };

  useEffect(() => {
    getData();
    getManusciptNames();
    getBrokenDecisions();
    getStaleDecisions();
  }, [datasetKey, projectKey]);

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
                end
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
              end
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
              end
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
            end
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
};

const mapContextToProps = ({
  user,
  issue,
  issueMap,
  getDuplicateWarningColor,
  projectKey,
}) => ({ user, issue, issueMap, getDuplicateWarningColor, projectKey });

export default withContext(mapContextToProps)(DatasetTasks);
