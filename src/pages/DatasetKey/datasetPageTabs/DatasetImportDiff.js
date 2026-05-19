import { useState, useEffect } from "react";
import { Alert, Empty, Row, Col, Select, notification, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import withRouter from "../../../withRouter";
import PageContent from "../../../components/PageContent";
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
import _ from "lodash";
import moment from "dayjs";
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
        const history_ = res.data.filter((e) => e.state === "finished");
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

  // Mount
  useEffect(() => {
    const init = async () => {
      if (!params.attempts) {
        const importHistory_ = await getHistory();
        if (importHistory_ && importHistory_.length > 1) {
          const a1 = importHistory_[1];
          const a2 = importHistory_[0];
          history.push({
            pathname: `/dataset/${datasetKey}/diff`,
            search: `?attempts=${a1.attempt}..${a2.attempt}`,
          });
        }
      } else {
        getData(search);
      }
      getHistory();
    };
    init();
  }, []);

  // React to datasetKey change
  useEffect(() => {
    getHistory();
    getData(location.search);
  }, [datasetKey]);

  // React to location.search change
  useEffect(() => {
    const p = qs.parse(location.search);
    if (attemptsParamIsSetAndValid(p.attempts)) {
      setAttempt1(Number(p.attempts.split("..")[0]));
      setAttempt2(Number(p.attempts.split("..")[1]));
    }
    getData(location.search);
  }, [location.search]);

  const diff = data;
  let html;
  if (diff) {
    try {
      html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: false,
        matching: "lines",
        outputFormat: "side-by-side",
      });
    } catch (parsingError) {
      // ignore parse errors in render
    }
  }

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
              label: `Attempt ${i.attempt} - ${moment(i.finished).format("MMMM Do YYYY, h:mm a")}`,
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
              label: `Attempt ${i.attempt} - ${moment(i.finished).format("MMMM Do YYYY, h:mm a")}`,
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
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
      {loading && (
        <Row style={{ marginTop: "40px" }}>
          <Col flex="auto"></Col>
          <Col>
            <Spin size="large" />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      )}
      {data === "" && (
        <Row style={{ marginTop: "40px" }}>
          <Col flex="auto"></Col>
          <Col>
            <Empty description="No diff between import attempts" />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ addError, dataset }) => ({ addError, dataset });
export default withContext(mapContextToProps)(withRouter(DatasetDiff));
