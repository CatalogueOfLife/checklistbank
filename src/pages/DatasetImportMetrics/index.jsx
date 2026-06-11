import { useState, useEffect, useRef } from "react";
import React from "react";

import config from "../../config";
import _ from "lodash";
import axios from "axios";
import moment from "dayjs";
import history from "../../history";
import { Drawer, Row, Col, Alert, Button, Spin, Divider } from "antd";
import ImportMetrics from "../../components/ImportMetrics";
import { DownloadOutlined } from "@ant-design/icons";

import PageContent from "../../components/PageContent";
import ImportHistory from "./ImportHistory";
import withContext from "../../components/hoc/withContext";
import withRouter from "../../withRouter";
import Auth from "../../components/Auth";
import PresentationItem from "../../components/PresentationItem";
import BooleanValue from "../../components/BooleanValue";
import DataLoader from "dataloader";
import { getUsersBatch } from "../../api/user";
import ImportMenu from "./Menu";
import qs from "query-string";

const userLoader = new DataLoader((ids) => getUsersBatch(ids));

const DatasetImportMetrics = (props) => {
  const {
    match,
    updateImportState,
    importState,
    dataset,
    user,
    origin,
    projectKey,
  } = props;

  const attempt = _.get(match, "params.taxonOrNameKey");
  const datasetKey_ = _.get(match, "params.key");
  const sourceKey = _.get(match, "params.sourceKey");
  const datasetKey = datasetKey_ || sourceKey;

  const { search } = location;
  const initParams = qs.parse(search);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [importHistory, setImportHistory] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(
    initParams?.showHistory === "true"
  );
  const [hasImportDiff, setHasImportDiff] = useState(false);
  const [hasNoImports, setHasNoImports] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  const getHistory = () => {
    return axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/import?limit=100${"WAITING, PREPARING, DOWNLOADING, PROCESSING, DELETING, INSERTING, MATCHING, INDEXING, ANALYZING, ARCHIVING, EXPORTING, FINISHED, CANCELED, FAILED"
        .split(", ")
        .map((st) => "&state=" + st)
        .join("")}`
    )
      .then((res) => {
        return Promise.all(
          res.data.map((hist) =>
            userLoader.load(hist.createdBy).then((user_) => (hist.user = user_))
          )
        ).then(() => res);
      })
      .then((res) => {
        const lastFinished = res.data.find((e) => e.state === "finished");
        const newHasImportDiff =
          res.data.filter((e) => e.state === "finished").length > 0;
        if (
          !attempt &&
          data &&
          data.state === "unchanged" &&
          lastFinished
        ) {
          history.push(
            `/dataset/${datasetKey}/imports/${lastFinished.attempt}`
          );
        }
        setImportHistory(res.data);
        setHasImportDiff(newHasImportDiff);
        return res;
      })
      .catch((err) => {
        setImportHistory(null);
      });
  };

  const getData_ = (currentAttempt) => {
    setLoading(true);
    const uri = currentAttempt
      ? `${config.dataApi}dataset/${datasetKey}/import/${currentAttempt}`
      : `${config.dataApi}dataset/${datasetKey}/import?limit=1`;
    axios(uri)
      .then((res) => {
        const d = currentAttempt ? res.data : res.data[0];
        return userLoader.load(d.createdBy).then((user_) => {
          d.user = user_;
          return d;
        });
      })
      .then((d) => {
        if (
          d &&
          importState
            .filter((i) => i.running)
            .map((i) => i.name)
            .includes(d.state)
        ) {
          if (!timerRef.current) {
            timerRef.current = setInterval(() => {
              getData_(currentAttempt);
              getHistory();
            }, 3000);
          }
        } else {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          timerRef.current = null;
          getHistory().then(updateImportState);
        }
        setLoading(false);
        setData(d);
        setHasNoImports(_.isUndefined(d));
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData(null);
      });
  };

  useEffect(() => {
    getData_(attempt);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // React to dataset key change
  useEffect(() => {
    getData_(attempt);
  }, [datasetKey_]);

  // React to attempt change
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    getData_(attempt);
  }, [attempt]);

  const isRunning =
    data &&
    importState
      .filter((i) => i.running)
      .map((i) => i.name)
      .includes(data.state);

  return (
    <PageContent>
      {!["xrelease", "release"].includes(origin) && (
        <ImportMenu
          isFinished={data?.state === "finished"}
          dataset={dataset}
          datasetKey={datasetKey}
          attempt={attempt || data?.attempt}
        />
      )}
      {!loading && dataset && importHistory && importHistory.length === 0 && (
        <Alert
          style={{ marginTop: "16px" }}
          title={
            dataset.origin === "project"
              ? "This dataset has never been released."
              : `This dataset has never been imported.${
                  Auth.isAuthorised(user, ["editor", "admin"])
                    ? " Press the import button to import it"
                    : ""
                }`
          }
          type="warning"
        />
      )}
      {importHistory && importHistory.length > 0 && (
        <Drawer
          title={
            dataset?.origin === "project"
              ? "Release history"
              : "Import history"
          }
          placement="right"
          closable={false}
          onClose={() => setHistoryVisible(false)}
          open={historyVisible}
        >
          <ImportHistory
            origin={dataset?.origin}
            importHistory={importHistory}
            attempt={attempt}
            projectKey={projectKey}
          />
        </Drawer>
      )}
      {data && isRunning && (
        <Spin>
          <Alert
            title={_.startCase(data.state)}
            description={`The ${
              ["project"].includes(origin) ? "Release" : "Import"
            } is not finished`}
            type="info"
          />
        </Spin>
      )}
      {dataset && importHistory && !["xrelease", "release"].includes(origin) && (
        <Button
          type="primary"
          style={{ display: "inline", position: "relative", top: "-48px", float: "right", marginRight: "10px" }}
          onClick={() => setHistoryVisible(true)}
        >
          History
        </Button>
      )}
      {data && data.state === "failed" && (
        <Row style={{ padding: "10px" }}>
          <Alert type="error" title={data.error} />
        </Row>
      )}
      {data && (
        <React.Fragment>
          {!isRunning && (
            <ImportMetrics
              data={data}
              subtitle={
                ["xrelease", "release", "project"].includes(origin)
                  ? `Released ${moment(data.finished).format(
                      "MMMM Do YYYY, h:mm a"
                    )}`
                  : null
              }
            />
          )}

          <Row style={{ padding: "10px" }}>
            <Divider titlePlacement="left">Details</Divider>
            <PresentationItem label="State">
              {_.get(data, "state")}
            </PresentationItem>
            <PresentationItem label="Created by">
              {_.get(data, "user.username")}
            </PresentationItem>
            <PresentationItem label="Started">
              {moment(data.started).format("lll")}
            </PresentationItem>
            <PresentationItem label="Finished">
              {moment(data.finished).format("lll")}
            </PresentationItem>
            <PresentationItem label="Download uri">
              {_.get(data, "downloadUri") && (
                <a href={_.get(data, "downloadUri")}>
                  {_.get(data, "downloadUri")}
                </a>
              )}
            </PresentationItem>
            <PresentationItem label="Archive">
              {_.get(data, "attempt") && (
                <a
                  href={`${
                    config.dataApi
                  }dataset/${datasetKey}/archive?attempt=${_.get(
                    data,
                    "attempt"
                  )}`}
                >
                  <DownloadOutlined />
                </a>
              )}
            </PresentationItem>
            <PresentationItem label="Upload">
              <BooleanValue value={_.get(data, "upload")}></BooleanValue>
            </PresentationItem>
            <PresentationItem label="MD5">
              {_.get(data, "md5")}
            </PresentationItem>
          </Row>
        </React.Fragment>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ user, dataset, importState, projectKey }) => ({
  user,
  dataset,
  importState,
  projectKey,
});

export default withContext(mapContextToProps)(withRouter(DatasetImportMetrics));
