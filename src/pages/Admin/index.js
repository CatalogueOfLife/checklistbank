import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import { Button, Alert, Popconfirm, notification } from "antd";
import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";
const { MANAGEMENT_CLASSIFICATION } = config;

class AdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      allSectorSyncloading: false,
      exportToOldPortalloading: false,
      updateAllLogosloading: false,
      recalculateSectorCountsLoading: false,
      rematchSectorsAndDecisionsLoading: false,
      exportResponse: null
    };
  }

  syncAllSectors = () => {
    this.setState({ allSectorSyncloading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync/all`
      )
      .then(res => {
        this.setState({ allSectorSyncloading: false, error: null, exportResponse: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "All sectors syncing"
          });
        });
      })
      .catch(err => this.setState({ error: err, allSectorSyncloading: false, exportResponse: null }));
  };

  exportToOldPortal = () => {
    this.setState({ exportToOldPortalloading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/exportAC`
      )
      .then(res => {
        this.setState({ exportToOldPortalloading: false, error: null , exportResponse: res.data}, () => {
          notification.open({
            message: "Action triggered",
            description:
              "exporting CoL draft to old portal synchroneously (might take long)"
          });
        });
      })
      .catch(err =>
        this.setState({ error: err, exportToOldPortalloading: false, exportResponse: null })
      );
  };
  updateAllLogos = () => {
    this.setState({ updateAllLogosloading: true });
    axios
      .post(`${config.dataApi}admin/logo-update`)
      .then(res => {
        this.setState({ updateAllLogosloading: false, error: null, exportResponse: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "updating all logos async"
          });
        });
      })
      .catch(err =>
        this.setState({ error: err, updateAllLogosloading: false, exportResponse: null })
      );
  };
  recalculateSectorCounts = () => {
    this.setState({ recalculateSectorCountsLoading: true });
    axios
      .post(`${config.dataApi}admin/sector-count-update`)
      .then(res => {
        this.setState(
          { recalculateSectorCountsLoading: false, error: null, exportResponse: null },
          () => {
            notification.open({
              message: "Action triggered",
              description: "recalculating sector counts"
            });
          }
        );
      })
      .catch(err =>
        this.setState({ error: err, recalculateSectorCountsLoading: false, exportResponse: null })
      );
  };
  rematchSectorsAndDecisions = () => {
    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(`${config.dataApi}admin/rematch`, {all: true})
      .then(res => {
        this.setState(
          { rematchSectorsAndDecisionsLoading: false, error: null, exportResponse: null },
          () => {
            notification.open({
              message: "Action triggered",
              description: "rematching all broken sectors and decisions"
            });
          }
        );
      })
      .catch(err =>
        this.setState({ error: err, rematchSectorsAndDecisionsLoading: false , exportResponse: null})
      );
  };

  render() {
    const {
      allSectorSyncloading,
      exportToOldPortalloading,
      updateAllLogosloading,
      recalculateSectorCountsLoading,
      rematchSectorsAndDecisionsLoading,
      exportResponse,
      error
    } = this.state;

    return (
      <Layout openKeys={[]} selectedKeys={["admin"]} title="CoL+ Admin">
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Admin</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
          {error && <Alert 
          closable
          onClose={() => this.setState({ error: null })}
          message={<ErrorMsg error={error} />} type="error" />}
          <Popconfirm
            placement="rightTop"
            title="Sync all sectors?"
            onConfirm={this.syncAllSectors}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={allSectorSyncloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Sync all sectors
            </Button>
          </Popconfirm>
          <Popconfirm
            placement="rightTop"
            title="Do you want to export the draft to the old portal?"
            onConfirm={this.exportToOldPortal}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={exportToOldPortalloading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Export CoL draft to old portal
            </Button>
          </Popconfirm>
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
            title="Do you want to rematch all broken sectors and decisions?"
            onConfirm={this.rematchSectorsAndDecisions}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={rematchSectorsAndDecisionsLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Rematch all broken sectors and decisions
            </Button>
          </Popconfirm>
          <a href={`${config.dataApi}download/`}>Downloads</a>
          {exportResponse && 
          <div>
            The export is available <a href={`${config.dataApi}download/`}>here</a>
            <pre>{exportResponse}</pre>
            </div>}
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(AdminPage);
