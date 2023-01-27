import React from "react";

import config from "../../config";
import _ from "lodash";
import axios from "axios";
import moment from "moment";
import history from "../../history";
import { Drawer, Row, Col, Alert, Button, Spin, Divider } from "antd";
import ImportMetrics from "../../components/ImportMetrics";
import { DownloadOutlined } from "@ant-design/icons";

import PageContent from "../../components/PageContent";
import ImportButton from "../Imports/importTabs/ImportButton";
import ImportHistory from "./ImportHistory";
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";
import ArchiveUpload from "../../components/ArchiveUpload";
import PresentationItem from "../../components/PresentationItem";
import BooleanValue from "../../components/BooleanValue";
import DataLoader from "dataloader";
import { getUsersBatch } from "../../api/user";
import Menu from "./Menu";
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

class DatasetImportMetrics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      data: null,
      importHistory: null,
      historyVisible: false,
      hasImportDiff: false,
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { taxonOrNameKey: attempt },
      },
    } = this.props;
    this.getData(attempt);
  }
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  componentDidUpdate = (prevProps) => {
    if (
      _.get(this.props, "match.params.key") !==
      _.get(prevProps, "match.params.key")
    ) {
      const {
        match: {
          params: { taxonOrNameKey: attempt },
        },
      } = this.props;
      this.getData(attempt);
    } else if (
      _.get(prevProps, "match.params.taxonOrNameKey") !==
      _.get(this.props, "match.params.taxonOrNameKey")
    ) {
      if (this.timer) {
        clearInterval(this.timer);
        delete this.timer;
      }

      this.getData(_.get(this.props, "match.params.taxonOrNameKey"));
    }
  };

  getData = (attempt) => {
    const {
      match: {
        params: { key: datasetKey },
      },
      updateImportState,
    } = this.props;

    this.setState({ loading: true });
    const uri = attempt
      ? `${config.dataApi}dataset/${datasetKey}/import/${attempt}`
      : `${config.dataApi}dataset/${datasetKey}/import?limit=1`;
    axios(uri)
      .then((res) => {
        const data = attempt ? res.data : res.data[0];
        return userLoader.load(data.createdBy).then((user) => {
          data.user = user;
          return data;
        });
      })
      .then((data) => {
        if (
          data &&
          ["processing", "downloading", "inserting", "analyzing"].includes(
            data.state
          )
        ) {
          if (!this.timer) {
            this.timer = setInterval(() => {
              this.getData(attempt);
              this.getHistory();
            }, 3000);
          }
        } else {
          if (this.timer) {
            clearInterval(this.timer);
          }
          delete this.timer;
          this.getHistory().then(updateImportState);
        }
        this.setState({
          loading: false,
          data: data,
          hasNoImports: _.isUndefined(data),
          err: null,
        });
      })
      .catch((err) => {
        this.setState({ loading: false, error: err, data: null });
      });
  };

  getHistory = () => {
    const {
      match: {
        params: { key: datasetKey },
      },
    } = this.props;

    return axios(`${config.dataApi}dataset/${datasetKey}/import?limit=20`)
      .then((res) => {
        return Promise.all(
          res.data.map((hist) =>
            userLoader.load(hist.createdBy).then((user) => (hist.user = user))
          )
        ).then(() => res);
      })
      .then((res) => {
        const lastFinished = res.data.find((e) => e.state === "finished");
        const hasImportDiff =
          res.data.filter((e) => e.state === "finished").length > 0;
        if (
          !_.get(this.props, "match.params.taxonOrNameKey") &&
          this.state.data &&
          this.state.data.state === "unchanged" &&
          lastFinished
        ) {
          history.push(
            `/dataset/${datasetKey}/imports/${lastFinished.attempt}`
          );
        }
        this.setState({ importHistory: res.data, hasImportDiff, err: null });
      })
      .catch((err) => {
        this.setState({ historyError: err, importHistory: null });
      });
  };

  showHistoryDrawer = () => {
    this.setState({ historyVisible: true });
  };
  hideHistoryDrawer = () => {
    this.setState({
      historyVisible: false,
    });
  };
  render() {
    const {
      match: {
        params: { taxonOrNameKey: attempt, key: datasetKey },
      },
      catalogueKey,
    } = this.props;

    const { dataset, user, origin, importState } = this.props;
    const { importHistory, loading, data, hasImportDiff } = this.state;
    const isRunning = this.state.data && importState
      .filter((i) => i.running)
      .map((i) => i.name)
      .includes(this.state.data.state);

    return (
      <PageContent>
        {!["xrelease","release"].includes(origin) && <Menu datasetKey={datasetKey} attempt={attempt} />}
        {!loading && dataset && importHistory && importHistory.length === 0 && (
          <Alert
            style={{ marginTop: "16px" }}
            message={
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
            title="Import history"
            placement="right"
            closable={false}
            onClose={this.hideHistoryDrawer}
            visible={this.state.historyVisible}
          >
            <ImportHistory
              importHistory={importHistory}
              attempt={attempt}
              catalogueKey={catalogueKey}
            />
          </Drawer>
        )}
        {this.state.data &&
          isRunning && (
            <Spin>
              <Alert
                message={_.startCase(this.state.data.state)}
                description="The import is not finished"
                type="info"
              />
            </Spin>
          )}
        {this.state.data && this.state.data.state === "failed" && (
          <Row style={{ padding: "10px" }}>
            <Alert type="error" message={this.state.data.error} />
          </Row>
        )}
        {this.state.data && this.state.data.state === "unchanged" && (
          <Row style={{ padding: "10px" }}>
            <Alert
              type="info"
              message={`Import on ${moment(this.state.data.started).format(
                "lll"
              )} unchanged from last import`}
            />
          </Row>
        )}
        {dataset && (
          <Row style={{ padding: "10px" }} type="flex">
            {data && !isRunning && (
              <Col>
                <h1>
                  {[ "xrelease", "release"].includes(origin) ? "Released " : "Imported "}
                  {moment(data.finished).format("lll")}
                </h1>
              </Col>
            )}
            <Col flex="auto"></Col>
            {/*             <Col style={{ textAlign: "right", marginRight: "8px" }}>
              {Auth.isAuthorised(user, ["editor", "admin"]) && (
                <ArchiveUpload
                  datasetKey={_.get(dataset, "key")}
                  origin={_.get(dataset, "origin")}
                />
              )}
            </Col> */}
            {![ "xrelease", "release"].includes(origin) && (
              <Col style={{ textAlign: "right" }}>
                {importHistory && (
                  <Button
                    type="primary"
                    style={{ display: "inline", marginLeft: "8px" }}
                    onClick={this.showHistoryDrawer}
                  >
                    History
                  </Button>
                )}
              </Col>
            )}
          </Row>
        )}
        {data &&  (
          <React.Fragment>
           {!isRunning && <ImportMetrics
              data={data}
              subtitle={
                [ "xrelease", "release"].includes(origin)
                  ? `Released ${moment(data.finished).format(
                      "MMMM Do YYYY, h:mm a"
                    )}`
                  : null
              }
            />}

            <Row style={{ padding: "10px" }}>
              <Divider orientation="left">Details</Divider>
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
                {_.get(data, "downloadUri") && <a href={_.get(data, "downloadUri")}>{_.get(data, "downloadUri")}</a>}
              </PresentationItem>
              <PresentationItem label="Archive">
                {_.get(data, "attempt") && <a href={`${config.dataApi}dataset/${datasetKey}/archive?attempt=${_.get(data, "attempt")}`}><DownloadOutlined /></a>}
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
  }
}
const mapContextToProps = ({ user, dataset, importState, catalogueKey }) => ({
  user,
  dataset,
  importState,
  catalogueKey,
});

export default withContext(mapContextToProps)(DatasetImportMetrics);
