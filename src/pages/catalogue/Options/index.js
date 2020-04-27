import React from "react";
import {withRouter} from "react-router-dom"
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Button,
  Alert,
  Popconfirm,
  notification
} from "antd";
import RematchResult from "../CatalogueSectors/RematchResult"
import SyncAllSectorsButton from "../../Admin/SyncAllSectorsButton"
import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";





class CatalogueOptions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      releaseColLoading: false,
      exportResponse: null,
      rematchInfo: null,
      rematchSectorsAndDecisionsLoading: false
    };
  }

  rematchSectorsAndDecisions = () => {
    const {
      match: {
        params: { catalogueKey }
      }
    } = this.props;

    this.setState({ rematchSectorsAndDecisionsLoading: true });
    axios
      .post(
        `${config.dataApi}dataset/${catalogueKey}/rematch`,
        { all: true }
      )
      .then(res => {
        this.setState(
          {
            rematchSectorsAndDecisionsLoading: false,
            error: null,
            rematchInfo: res.data
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          rematchInfo: null,
          rematchSectorsAndDecisionsLoading: false
        })
      );
  };

 


  releaseCatalogue = () => {
    const { match: {
        params: { catalogueKey }
      }} = this.props;

    this.setState({ releaseColLoading: true });
    axios
      .post(
        `${config.dataApi}dataset/${catalogueKey}/release`
      )
      .then(res => {
        this.setState(
          {
            releaseColLoading: false,
            error: null,
            exportResponse: res.data
          },
          () => {
            notification.open({
              message: "Action triggered",
              description:
                "release selected catalogue to old portal synchroneously (might take long)"
            });
          }
        );
      })
      .catch(err =>
        this.setState({
          error: err,
          releaseColLoading: false,
          exportResponse: null
        })
      );
  };

  
  exportDataset = () => {
    const { match: {
        params: { catalogueKey }
      }} = this.props;
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/export`)
      .then(res => {
        this.setState({ error: null }, () => {
          notification.open({
            message: "Process started",
            description: `The dataset is being exported`
          });
        });
      })
      .catch(err => this.setState({ error: err }));
  };


  render() {
    const {
      releaseColLoading,
      rematchInfo,
      rematchSectorsAndDecisionsLoading,
      error
    } = this.state;
    
    const { match: {
        params: { catalogueKey }
      }, catalogue} = this.props;
    return (
      <Layout selectedKeys={["catalogueOptions"]}
      openKeys={["assembly"]}
      title={catalogue ? catalogue.title : ''}>
          
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Options</title>
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
          
          {rematchInfo && (
            <Alert
              closable
              onClose={() => this.setState({ rematchInfo: null })}
              message="Rematch succeded"
              description={ <RematchResult rematchInfo={rematchInfo}/>}
              type="success"
              style={{marginBottom: '10px'}}
            />
          )}
          <Row>
            <Col span={12}>
            <SyncAllSectorsButton 
            catalogueKey={catalogueKey}
            onError={err => this.setState({error: err})}
            >
              
            </SyncAllSectorsButton>
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
              style={{  marginBottom: "10px" }}
            >
              Rematch all broken sectors and decisions
            </Button>
          </Popconfirm>
            </Col>
            <Col span={12} style={{textAlign: 'right'}}>

              <Popconfirm
            placement="rightTop"
            title={`Do you want to export ${catalogue.title} to the old portal?`}
            onConfirm={this.releaseCatalogue}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              loading={releaseColLoading}
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              Release catalogue
            </Button>
            
          </Popconfirm>
          <br/>
          <Button
                type="primary"
                onClick={() => this.exportDataset()}
                style={{ marginRight: "10px", marginBottom: "10px" }}
              >
                Export dataset
              </Button>
   
            </Col>

          </Row>

        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({
  catalogue
});
export default withContext(mapContextToProps)(withRouter(CatalogueOptions));
