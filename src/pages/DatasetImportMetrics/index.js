import React from "react";

import PropTypes from "prop-types";
import config from "../../config";
import _ from "lodash";
import axios from "axios";
import moment from "moment";
import history from "../../history"
import Layout from "../../components/LayoutNew";
import { Drawer, Tag, Row, Col, Alert, Button, Spin } from "antd";
import ImportChart from "../../components/ImportChart";
import PageContent from "../../components/PageContent";
import ImportButton from "../Imports/importTabs/ImportButton";
import ImportHistory from "./ImportHistory";
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";

class DatasetImportMetrics extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null, importHistory: [], historyVisible: false };
  }

  componentWillMount() {
    const {
      match: {
        params: { attempt }
      }
    } = this.props;
    this.getData(attempt);
    
  }
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
  componentWillReceiveProps = nextProps => {
    if (
      _.get(nextProps, "match.params.attempt") !==
      _.get(this.props, "match.params.attempt")
    ) {
      if (this.timer) {
        clearInterval(this.timer);
        delete this.timer;
      }

      this.getData(_.get(nextProps, "match.params.attempt"));
    }
  };

  getData = attempt => {
    const {
      match: {
        params: { datasetKey }
      }
    } = this.props;

    this.setState({ loading: true });
    const uri = attempt
      ? `${config.dataApi}dataset/${datasetKey}/import/${attempt}`
      : `${config.dataApi}dataset/${datasetKey}/import?limit=1`;
    axios(uri)
      .then(res => {
        const data = attempt ? res.data : res.data[0];
        if (["processing", "downloading", "inserting", "building metrics"].includes(data.state)) {
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
          this.getHistory();
        }
        this.setState({ loading: false, data: data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  getHistory = () => {
    const {
      match: {
        params: { datasetKey, attempt }
      }
    } = this.props;

    axios(`${config.dataApi}dataset/${datasetKey}/import?limit=20`)
      .then(res => {
        const lastFinished = res.data.find(e => e.state === 'finished')
        if(!_.get(this.props, "match.params.attempt") && this.state.data && this.state.data.state === 'unchanged' && lastFinished){
          history.push(`/dataset/${datasetKey}/metrics/${lastFinished.attempt}`)
        }
        this.setState({ importHistory: res.data, err: null });
      })
      .catch(err => {
        this.setState({ historyError: err, importHistory: [] });
      });
  };

  showHistoryDrawer = () => {
    this.setState({ historyVisible: true });
  };
  hideHistoryDrawer = () => {
    this.setState({
      historyVisible: false
    });
  };
  render() {
    const {
      match: {
        params: { datasetKey, attempt }
      }
    } = this.props;

    const { dataset, user, origin, importState } = this.props;
    const { importHistory } = this.state;

    return (
      <Layout
        selectedMenuItem="datasetKey"
        selectedDataset={{...dataset, importState: importState}}
        section="metrics"
        openKeys={["datasetKey"]}
        selectedKeys={["metrics"]}
      >
        <PageContent>
          {!this.state.loading && !this.state.data && (
            <Row style={{ padding: "10px" }}>
              <Alert type="warning" message="No finished imports yet" />
            </Row>
          )}
          {importHistory && importHistory.length === 0 && <Alert style={{marginTop: '16px'}} message="This dataset has never been imported. Press the import button to import it" type="warning" />}
          {importHistory && importHistory.length > 0 && (
            <Drawer
              title="Import history"
              placement="right"
              closable={false}
              onClose={this.hideHistoryDrawer}
              visible={this.state.historyVisible}
            >
              <ImportHistory importHistory={importHistory} attempt={attempt} />
            </Drawer>
          )}
          {this.state.data &&
            importState.filter(i => i.running === "true").map(i => i.name).includes(
              this.state.data.state
            ) && (
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
              <Alert type="info" message={`Import on ${moment(this.state.data.started).format("lll")} unchanged from last import`} />
            </Row>
          )}

          {this.state.data && (
            <React.Fragment>
              <Row style={{ padding: "10px" }}>
                <Col span={20}>
                  {_.map(
                    ['taxonCount', 'nameCount', 'verbatimCount', 'referenceCount', 'distributionCount', 'vernacularCount', 'mediaCount', 'descriptionCount'  ],
                    c => {
                      return _.get(this.state, `data.${c}`) ? (
                        <Tag key={c} color="blue">
                          {_.startCase(c)}: {_.get(this.state, `data.${c}`)}
                        </Tag>
                      ) : (
                        ""
                      );
                    }
                  )}
                </Col>
                <Col span={4} style={{ textAlign: "right" }}>
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&
                    origin !== "uploaded" && dataset && (
                      <ImportButton
                        style={{ display: "inline" }}
                        record={{datasetKey: dataset.key}}
                        onStartImportSuccess={() => this.getData(attempt)}
                        onDeleteSuccess={() => this.getData(attempt)}
                      />
                    )}
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
              </Row>
              {(_.get(this.state, "data.taxaByRankCount") ||
                _.get(this.state, "data.usagesByStatusCount")) && (
                <Row>
                  <Col span={12} style={{ padding: "10px" }}>
                    {_.get(this.state, "data.taxaByRankCount") && (
                      <ImportChart
                        nameSearchParam="rank"
                        defaultType="pie"
                        datasetKey={datasetKey}
                        data={_.get(this.state, "data.taxaByRankCount")}
                        title="Accepted Names by Rank"
                        subtitle={`Imported ${moment(
                          this.state.data.finished
                        ).format("MMMM Do YYYY, h:mm a")}`}
                      />
                    )}
                  </Col>
                  <Col span={12} style={{ padding: "10px" }}>
                    {_.get(this.state, "data.usagesByStatusCount") && (
                      <ImportChart
                        nameSearchParam="status"
                        defaultType="pie"
                        datasetKey={datasetKey}
                        data={_.get(this.state, "data.usagesByStatusCount")}
                        title="Usages by status"
                        subtitle={`Imported ${moment(
                          this.state.data.finished
                        ).format("MMMM Do YYYY, h:mm a")}`}
                      />
                    )}
                  </Col>
                </Row>
              )}
              <Row>
                <Col span={12} style={{ padding: "10px" }}>
                  {_.get(this.state, "data.namesByRankCount") && (
                    <ImportChart
                      nameSearchParam="rank"
                      defaultType="pie"
                      datasetKey={datasetKey}
                      data={_.get(this.state, "data.namesByRankCount")}
                      title="Names by rank"
                      subtitle={`Imported ${moment(
                        this.state.data.finished
                      ).format("MMMM Do YYYY, h:mm a")}`}
                    />
                  )}
                </Col>
                <Col span={12} style={{ padding: "10px" }}>
                  {_.get(this.state, "data.namesByTypeCount") && (
                    <ImportChart
                      nameSearchParam="type"
                      defaultType="pie"
                      datasetKey={datasetKey}
                      data={_.get(this.state, "data.namesByTypeCount")}
                      title="Names by type"
                      subtitle={`Imported ${moment(
                        this.state.data.finished
                      ).format("MMMM Do YYYY, h:mm a")}`}
                    />
                  )}
                </Col>
              </Row>

              <Row>
                <Col span={12} style={{ padding: "10px" }}>
                  {_.get(this.state, "data.namesByOriginCount") && (
                    <ImportChart
                      nameSearchParam="origin"
                      defaultType="pie"
                      datasetKey={datasetKey}
                      data={_.get(this.state, "data.namesByOriginCount")}
                      title="Names by origin"
                      subtitle={`Imported ${moment(
                        this.state.data.finished
                      ).format("MMMM Do YYYY, h:mm a")}`}
                    />
                  )}
                </Col>
                <Col span={12} style={{ padding: "10px" }}>
                  {_.get(this.state, "data.verbatimByTypeCount") && (
                    <ImportChart
                      nameSearchParam="type" 
                      verbatim={true}
                      defaultType="pie"
                      datasetKey={datasetKey}
                      data={_.get(this.state, "data.verbatimByTypeCount")}
                      title="Verbatim records by type"
                      subtitle={`Imported ${moment(
                        this.state.data.finished
                      ).format("MMMM Do YYYY, h:mm a")}`}
                    />
                  )}
                </Col>
              </Row>
              <Row>
                <Col span={24} style={{ padding: "10px" }}>
                  {_.get(this.state, "data.vernacularsByLanguageCount") && (
                    <ImportChart
                      nameSearchParam="vernacularLang"
                      defaultType="column"
                      datasetKey={datasetKey}
                      data={_.get(
                        this.state,
                        "data.vernacularsByLanguageCount"
                      )}
                      title="Vernacular names by language"
                      subtitle={`Imported ${moment(
                        this.state.data.finished
                      ).format("MMMM Do YYYY, h:mm a")}`}
                    />
                  )}
                </Col>
              </Row>
           { (_.get(this.state, 'data.nameRelationsByTypeCount') || _.get(this.state, 'data.distributionsByGazetteerCount')) &&  <Row>
          <Col span={_.get(this.state, 'data.distributionsByGazetteerCount') ? 12 : 24} style={{ padding: '10px' }}>
          {_.get(this.state, 'data.nameRelationsByTypeCount') && <ImportChart defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data.nameRelationsByTypeCount')} title="Relations by type" subtitle={`Imported ${moment(this.state.data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
          </Col>
          <Col span={_.get(this.state, 'data.nameRelationsByTypeCount') ? 12 : 24} style={{ padding: '10px' }}>
          {_.get(this.state, 'data.distributionsByGazetteerCount') && <ImportChart  verbatim={true} defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data.distributionsByGazetteerCount')} title="Distribution by Gazetteer" subtitle={`Imported ${moment(this.state.data.finished).format('MMMM Do YYYY, h:mm a')}`} />}

          </Col>
          
        </Row>}

{ (_.get(this.state, 'data.mediaByTypeCount') || _.get(this.state, 'data.namesByStatusCount')) &&  <Row>
<Col span={_.get(this.state, 'data.namesByStatusCount') ? 12 : 24} style={{ padding: '10px' }}>
{_.get(this.state, 'data.mediaByTypeCount') && <ImportChart defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data.mediaByTypeCount')} title="Media by type" subtitle={`Imported ${moment(this.state.data.finished).format('MMMM Do YYYY, h:mm a')}`} />}
</Col>
<Col span={_.get(this.state, 'data.mediaByTypeCount') ? 12 : 24} style={{ padding: '10px' }}>
{_.get(this.state, 'data.namesByStatusCount') && <ImportChart  verbatim={true} defaultType="pie" datasetKey={datasetKey} data={_.get(this.state, 'data.namesByStatusCount')} title="Names by Status" subtitle={`Imported ${moment(this.state.data.finished).format('MMMM Do YYYY, h:mm a')}`} />}

</Col>

</Row>}

            </React.Fragment>
          )}
        </PageContent>
      </Layout>
    );
  }
}
const mapContextToProps = ({ user, dataset, importState }) => ({ user, dataset, importState });

export default withContext(mapContextToProps)(DatasetImportMetrics);
