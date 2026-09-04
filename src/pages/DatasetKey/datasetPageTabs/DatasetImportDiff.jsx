import { useState, useEffect } from "react";
import { Alert, Empty, Row, Col, Select, App, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import withRouter from "../../../withRouter";
import PageContent from "../../../components/PageContent";
import NamesDiffView from "../../../components/NamesDiffView";
import { formatTime } from "../../../dateTime";
import history from "../../../history";
import qs from "query-string";
import Menu from "../../DatasetImportMetrics/Menu";
import withContext from "../../../components/hoc/withContext";

const attemptsParamIsSetAndValid = (attempts, onError) => {
  if (attempts) {
    const splitted = attempts.split("..");
    if (
      splitted.length !== 2 ||
      isNaN(Number(splitted[0])) ||
      isNaN(Number(splitted[1]))
    ) {
      if (onError) onError({ message: `Invalid attempts param given: ${attempts}` });
      return false;
    } else {
      return true;
    }
  }
  return false;
};

const DatasetDiff = ({ datasetKey, location, dataset, addError }) => {
  const { notification } = App.useApp();
  const { search } = location;
  const params = qs.parse(search);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyOneImport, setOnlyOneImport] = useState(false);
  const [attempt1, setAttempt1] = useState(
    attemptsParamIsSetAndValid(params.attempts)
      ? Number(params.attempts.split("..")[0])
      : 1
  );
  const [attempt2, setAttempt2] = useState(
    attemptsParamIsSetAndValid(params.attempts)
      ? Number(params.attempts.split("..")[1])
      : 2
  );

  const getData = (locationSearch) => {
    const p = qs.parse(locationSearch);
    if (!attemptsParamIsSetAndValid(p.attempts, setError)) return;
    axios(
      `${config.dataApi}dataset/${datasetKey}/diff?attempts=${p.attempts}`
    )
      .then((res) => {
        setLoading(false);
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData(null);
      });
  };

  const getHistory = () => {
    return axios(`${config.dataApi}dataset/${datasetKey}/import?limit=20`)
      .then((res) => {
        const history_ = res.data.filter((e) => e.status === "finished");
        setImportHistory(history_);
        if (history_.length === 1) {
          setLoading(false);
          setOnlyOneImport(true);
        }
        return history_;
      })
      .catch((err) => {
        setError(err);
        setImportHistory([]);
      });
  };

  // Import history: on mount and whenever the dataset changes.
  useEffect(() => {
    getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey]);

  // Default ?attempts to the two most recent finished imports once the history
  // has arrived. Derived from state, so it costs no extra request.
  useEffect(() => {
    if (qs.parse(location.search).attempts || importHistory.length < 2) return;
    const a1 = importHistory[1];
    const a2 = importHistory[0];
    history.push({
      pathname: `/dataset/${datasetKey}/diff`,
      search: `?attempts=${a1.attempt}..${a2.attempt}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importHistory, datasetKey]);

  // The diff itself is URL driven. This runs on mount too, so nothing else may
  // fetch it. getData no-ops while ?attempts is still missing.
  useEffect(() => {
    const p = qs.parse(location.search);
    if (attemptsParamIsSetAndValid(p.attempts)) {
      setAttempt1(Number(p.attempts.split("..")[0]));
      setAttempt2(Number(p.attempts.split("..")[1]));
    }
    getData(location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, location.search]);

  return (
    <PageContent>
      <Menu dataset={dataset} datasetKey={datasetKey} />
      <Row style={{ marginBottom: "8px" }}>
        <Col span={12}>
          <Select
            value={attempt1}
            style={{ width: "90%" }}
            onChange={(value) => {
              if (value >= attempt2) {
                notification.error({
                  message: "Invalid attempt",
                  description: "Attempt 1 must be less than Attempt 2",
                  duration: 2,
                });
              } else {
                history.push({
                  pathname: `/dataset/${datasetKey}/diff`,
                  search: `?attempts=${value}..${attempt2}`,
                });
              }
            }}
            showSearch
            options={importHistory.map((i) => ({
              key: i.attempt,
              value: i.attempt,
              label: `Attempt ${i.attempt} - ${formatTime(i.finished, "MMMM Do YYYY, h:mm a")}`,
            }))}
          />
        </Col>
        <Col span={12}>
          <Select
            style={{ width: "90%" }}
            value={attempt2}
            onChange={(value) => {
              if (value <= attempt1) {
                notification.error({
                  message: "Invalid attempt",
                  description: "Attempt 2 must be greater tha Attempt 1",
                  duration: 2,
                });
              } else {
                history.push({
                  pathname: `/dataset/${datasetKey}/diff`,
                  search: `?attempts=${attempt1}..${value}`,
                });
              }
            }}
            showSearch
            options={importHistory.map((i) => ({
              key: i.attempt,
              value: i.attempt,
              label: `Attempt ${i.attempt} - ${formatTime(i.finished, "MMMM Do YYYY, h:mm a")}`,
            }))}
          />
        </Col>
      </Row>
      {onlyOneImport && <Empty description="No diff available" />}
      {error && (
        <Row style={{ marginBottom: "8px" }}>
          <Alert type="error" description={<ErrorMsg error={error} />} />
        </Row>
      )}
      {data && !loading && <NamesDiffView diff={data} />}
      {loading && (
        <Row style={{ marginTop: "40px" }}>
          <Col flex="auto"></Col>
          <Col>
            <Spin size="large" />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ addError, dataset }) => ({ addError, dataset });
export default withContext(mapContextToProps)(withRouter(DatasetDiff));
