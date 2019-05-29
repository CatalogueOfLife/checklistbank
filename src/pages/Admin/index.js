import React from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import { Button, Alert, notification } from "antd";

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
      rematchSectorsAndDecisionsLoading: false
    };
  }


  syncAllSectors = () => {
    this.setState({ allSectorSyncloading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/sync/all`
      )
      .then(res => {
        this.setState({ allSectorSyncloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "All sectors syncing"
          });
        });
      })
      .catch(err => this.setState({ error: err, allSectorSyncloading: false }));
  };

  exportToOldPortal = () => {
    this.setState({ exportToOldPortalloading: true });
    axios
      .post(
        `${config.dataApi}assembly/${MANAGEMENT_CLASSIFICATION.key}/exportAC`
      )
      .then(res => {
        this.setState({ exportToOldPortalloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "exporting CoL draft to old portal synchroneously (might take long)"
          });
        });
      })
      .catch(err => this.setState({ error: err, exportToOldPortalloading: false }));
  };
  updateAllLogos = () => {
    this.setState({ updateAllLogosloading: true });
    axios
      .post(
        `${config.dataApi}/admin/logo-update`
      )
      .then(res => {
        this.setState({ updateAllLogosloading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "updating all logos async"
          });
        });
      })
      .catch(err => this.setState({ error: err, updateAllLogosloading: false }));
  };
  recalculateSectorCounts = () => {
    this.setState({ recalculateSectorCountsLoading: true });
    axios
      .post(
        `${config.dataApi}/admin/sector-count-update`
      )
      .then(res => {
        this.setState({ recalculateSectorCountsLoading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "recalculating sector counts"
          });
        });
      })
      .catch(err => this.setState({ error: err, recalculateSectorCountsLoading: false }));
  };
  rematchSectorsAndDecisions = () => {
    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(
        `${config.dataApi}/admin/rematch-decisions`
      )
      .then(res => {
        this.setState({ rematchSectorsAndDecisionsLoading: false, error: null }, () => {
          notification.open({
            message: "Action triggered",
            description: "rematching all broken sectors and decisions"
          });
        });
      })
      .catch(err => this.setState({ error: err, rematchSectorsAndDecisionsLoading: false }));
  };


  
  render() {
    const { allSectorSyncloading, exportToOldPortalloading, updateAllLogosloading,recalculateSectorCountsLoading,rematchSectorsAndDecisionsLoading, error } = this.state;

    return (
      <Layout 
      openKeys={[]} selectedKeys={["admin"]} title="CoL+ Admin"
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Admin</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
          {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
          <Button
            type="primary"
            loading={allSectorSyncloading}
            onClick={this.syncAllSectors}
            style={{marginRight: '10px',  marginBottom: '10px'}}
          >
            Sync all sectors
          </Button>
          <Button
            type="primary"
            loading={exportToOldPortalloading}
            onClick={this.exportToOldPortal}
            style={{marginRight: '10px',  marginBottom: '10px'}}

          >
            Export CoL draft to old portal 
          </Button>
          <Button
            type="primary"
            loading={updateAllLogosloading}
            onClick={this.updateAllLogos}
            style={{marginRight: '10px',  marginBottom: '10px'}}

          >
            Update all logos 
          </Button>
          <Button
            type="primary"
            loading={recalculateSectorCountsLoading}
            onClick={this.recalculateSectorCounts}
            style={{marginRight: '10px',  marginBottom: '10px'}}

          >
            Recalculate sector counts
          </Button>

          <Button
            type="primary"
            loading={rematchSectorsAndDecisionsLoading}
            onClick={this.rematchSectorsAndDecisions}
            style={{marginRight: '10px',  marginBottom: '10px'}}

          >
            Rematch all broken sectors and decisions
          </Button>
          
          
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(AdminPage);
