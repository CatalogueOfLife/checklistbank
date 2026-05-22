import { useState, useEffect } from "react";
import { Alert, Tag, Card, Spin, Row, Col, Checkbox, Button } from "antd";
import axios from "axios";
import config from "../../../config";
import { NavLink } from "react-router-dom";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { getDuplicateOverview } from "../../../api/dataset";
import ErrorMsg from "../../../components/ErrorMsg";
import DatasetAutocomplete from "../../project/Assembly/DatasetAutocomplete";

const DatasetTasks = (props) => {
  const { datasetKey, assembly, getDuplicateWarningColor, projectKey } = props;

  const [duplicates, setDuplicates] = useState([]);
  const [manuscriptNames, setManuscriptNames] = useState(null);
  const [staleDecisions, setStaleDecisions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceDatasetKey, setSourceDatasetKey] = useState(null);
  const [merge, setMerge] = useState(false);
  const [sourceOnly, setSourceOnly] = useState(false);

  const getData = async (srcKey) => {
    const resolvedSourceKey = srcKey !== undefined ? srcKey : sourceDatasetKey;
    setLoading(true);
    const duplicatesWithNodecision = await getDuplicateOverview({
      datasetKey,
      projectKey: assembly ? datasetKey : null,
      sourceDatasetKey: resolvedSourceKey,
      sourceOnly,
    });

    const dupes = duplicatesWithNodecision.map((d) => ({
      id: d.id,
      text: d.text,
      count: d.count,
      error: d.error,
    }));
    setDuplicates(dupes);
    setLoading(false);
  };

  const getManusciptNames = (srcKey) => {
    const resolvedSourceKey = srcKey !== undefined ? srcKey : sourceDatasetKey;
    axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?nomstatus=manuscript&limit=0${
        resolvedSourceKey
          ? "&sourceDatasetKey=" + resolvedSourceKey
          : ""
      }`
    ).then((res) => {
      setManuscriptNames({ count: res.data.total });
    });
  };

  const getStaleDecisions = (srcKey) => {
    const resolvedSourceKey = srcKey !== undefined ? srcKey : sourceDatasetKey;
    axios(
      `${config.dataApi}dataset/${datasetKey}/decision/stale${
        resolvedSourceKey
          ? "&sourceDatasetKey=" + resolvedSourceKey
          : ""
      }`
    ).then((res) => {
      setStaleDecisions({ count: res.data.total });
    });
  };

  useEffect(() => {
    if (!assembly) {
      getData();
      getManusciptNames();
      getStaleDecisions();
    }
  }, []);

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
        {!!assembly && (
          <Row>
            <Col>
              <Button
                loading={loading}
                disabled={loading}
                type="primary"
                onClick={() => {
                  getData();
                  getManusciptNames();
                  getStaleDecisions();
                }}
              >
                Load tasks{" "}
                {sourceDatasetKey
                  ? `for source ${sourceDatasetKey}`
                  : ""}
              </Button>
            </Col>
            <Col flex="auto"></Col>
            <Col>
              <DatasetAutocomplete
                placeHolder="Filter to source"
                contributesTo={projectKey}
                autoFocus={false}
                onSelectDataset={(ds) => {
                  const newKey = ds?.key;
                  setSourceDatasetKey(newKey);
                  setDuplicates([]);
                  setManuscriptNames(null);
                  setStaleDecisions(null);
                  getData(newKey);
                }}
                merge={merge}
              />
              <Checkbox
                value={merge}
                onChange={(e) => setMerge(e.target.checked)}
              >
                Include merged sources
              </Checkbox>
              <Checkbox
                value={sourceOnly}
                onChange={(e) => setSourceOnly(e.target.checked)}
              >
                From this source only
              </Checkbox>
            </Col>
          </Row>
        )}
        {duplicates?.length > 0 && <h1>Duplicates</h1>}

        {loading && <Spin />}

        {duplicates
          .filter((d) => !d.error)
          .map((d) => (
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/duplicates`,
                search: `?_colCheck=${d.id}${
                  sourceDatasetKey
                    ? "&sourceDatasetKey=" + sourceDatasetKey
                    : ""
                }${
                  sourceOnly
                    ? "&sourceOnly=" + sourceOnly
                    : ""
                }`,
              }}
              end
            >
              <Tag
                key={d.id}
                style={{ marginBottom: "10px" }}
                color={getDuplicateWarningColor(d.count)}
              >
                {d.text} <strong>{d.count}</strong>
              </Tag>{" "}
            </NavLink>
          ))}
        {!!manuscriptNames?.count && <h1>Manuscript names</h1>}
        {manuscriptNames && (
          <NavLink
            to={{
              pathname: `/dataset/${datasetKey}/workbench`,
              search: `?nomstatus=manuscript&limit=50${
                sourceDatasetKey
                  ? "&sourceDatasetKey=" + sourceDatasetKey
                  : ""
              }`,
            }}
            end
          >
            <Tag
              style={{ marginBottom: "10px" }}
              color={getDuplicateWarningColor(manuscriptNames.count)}
            >
              Manuscript names <strong>{`${manuscriptNames.count}`}</strong>
            </Tag>
          </NavLink>
        )}
        {staleDecisions && (
          <NavLink
            to={{
              pathname: `/project/${datasetKey}/decision`,
              search: `?stale=true${
                sourceDatasetKey
                  ? "&sourceDatasetKey=" + sourceDatasetKey
                  : ""
              }`,
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
