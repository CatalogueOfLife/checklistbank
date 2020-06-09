import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import { Row, Col, Switch, Button, Alert, Popconfirm, notification, Form } from "antd";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";

const FormItem = Form.Item;




class AdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      updateAllLogosloading: false,
      recalculateSectorCountsLoading: false,
      background: {},
      backgroundError: null
    };
  }

  componentDidMount = () => {
    this.getBackground();
  };

 
  getBackground = () => {
    axios
      .get(`${config.dataApi}admin/background`)
      .then(res => {
        this.setState({ background: res.data, backgroundError: null });
      })
      .catch(err => this.setState({ backgroundError: err }));
  };

  updateBackground = (param, checked) => {
    const { background } = this.state;
    axios
      .put(`${config.dataApi}admin/background`, {
        ...background,
        [param]: checked
      })
      .then(() => {
        this.setState({
          background: { ...background, [param]: checked },
          backgroundError: null
        });
      })
      .catch(err => this.setState({ backgroundError: err }));
  };



  updateAllLogos = () => {
    this.setState({ updateAllLogosloading: true });
    axios
      .post(`${config.dataApi}admin/logo-update`)
      .then(res => {
        this.setState(
          { updateAllLogosloading: false, error: null },
          () => {
            notification.open({
              message: "Action triggered",
              description: "updating all logos async"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          updateAllLogosloading: false
        })
      );
  };

  recalculateSectorCounts = () => {
    this.setState({ recalculateSectorCountsLoading: true });
    axios
      .post(`${config.dataApi}admin/sector-count-update`)
      .then(res => {
        this.setState(
          {
            recalculateSectorCountsLoading: false,
            error: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "recalculating sector counts"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          recalculateSectorCountsLoading: false
        })
      );
  };



  reindexAllDatasets = () => {
    this.setState({ reindexAllDatasetsLoading: true });
    axios
      .post(`${config.dataApi}admin/reindex`, { all: true })
      .then(res => {
        this.setState(
          {
            reindexAllDatasetsLoading: false,
            error: null
          },
          () => {
            notification.open({
              message: "Action triggered",
              description: "reindexing all datasets"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          reindexAllDatasetsLoading: false
        })
      );
  };



  restartImporter = () => {
    axios
      .post(`${config.dataApi}importer/restart`)
      .then(res => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Importer restarted"
          });
        });
      })
      .catch(err => this.setState({ error: err }));
  };

  render() {
    const {
      updateAllLogosloading,
      recalculateSectorCountsLoading,
      reindexAllDatasetsLoading,
      error,
      background
    } = this.state;
    return (
      <Layout openKeys={[]} selectedKeys={["admin"]} title="CoL+ Admin">
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Admin</title>
          <link rel="canonical" href="http://data.catalogue.life" />
        </Helmet>
        <PageContent>
          {error && (
            <Row>
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                message={<ErrorMsg error={error} />}
                type="error"
              />
            </Row>
          )}
          <Row>
            <Col span={24}>
              <Form layout="inline">
                <FormItem label="Background GBIF Sync">
                  <Switch
                    onChange={checked => {
                      this.updateBackground("gbifSync", checked);
                    }}
                    checked={background.gbifSync}
                  />
                </FormItem>
                <FormItem label="Background importer">
                  <Switch
                    onChange={checked => {
                      this.updateBackground("importer", checked);
                    }}
                    checked={background.importer}
                  />
                </FormItem>
              </Form>
            </Col>
            </Row>

            <Row>
              <Popconfirm
            placement="rightTop"
            title="Update all logos?"
            onConfirm={this.updateAllLogos}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={updateAllLogosloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Update all logos
            </Button>
          </Popconfirm>

          <Popconfirm
            placement="rightTop"
            title="Recalculate sector counts?"
            onConfirm={this.recalculateSectorCounts}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={recalculateSectorCountsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Recalculate sector counts
            </Button>
          </Popconfirm>

          <Popconfirm
            placement="rightTop"
            title="Do you want to reindex all datasets?"
            onConfirm={this.reindexAllDatasets}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={reindexAllDatasetsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Reindex all datasets
            </Button>
          </Popconfirm>

          <Popconfirm
            placement="rightTop"
            title="Do you want to restart the importer?"
            onConfirm={this.restartImporter}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Restart importer
            </Button>
          </Popconfirm>           

          </Row>


          <Row>
            <a href={config.downloadApi}>Downloads</a>
          </Row>
          <Row>
            <a href={`${config.dataApi}monitor/healthcheck`}>Health</a> -
            <a href={`${config.dataApi}monitor/threads`}>Threads</a> -
            <a href={`${config.dataApi}monitor/metrics`}>Metrics</a> -
            <a href={`${config.dataApi}monitor/pprof`}>CPU Profile</a> -
            <a href={`${config.dataApi}monitor/pprof?state=blocked`}>
              CPU Blocked
            </a>
          </Row>

        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogueKey, catalogue, setCatalogue }) => ({
  catalogueKey,
  catalogue,
  setCatalogue
});
export default withContext(mapContextToProps)(AdminPage);
