import React from "react";

import PropTypes from "prop-types";
import config from "../../config";
import _ from "lodash";
import axios from "axios";
import moment from "moment";
import history from "../../history"
import Layout from "../../components/LayoutNew";
import { Drawer, Tag, Row, Col, Alert, Button, Spin, Divider } from "antd";
import ImportChart from "../../components/ImportChart";
import ImportMetrics from "../../components/ImportMetrics";

import PageContent from "../../components/PageContent";
import ImportButton from "../Imports/importTabs/ImportButton";
import ImportHistory from "./ImportHistory";
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";
import ArchiveUpload from "../../components/ArchiveUpload"
import PresentationItem from "../../components/PresentationItem";
import BooleanValue from "../../components/BooleanValue";
import DataLoader from "dataloader"
import {getUsersBatch} from "../../api/user"

const userLoader = new DataLoader((ids) => getUsersBatch(ids));

class DatasetImportMetrics extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, data: null, importHistory: null, historyVisible: false };
  }

  componentDidMount() {
    const {
      match: {
        params: { taxonOrNameKey:attempt }
      }
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
            params: { taxonOrNameKey:attempt }
          }
        } = this.props;
        this.getData(attempt);
      }
    
   else if (
      _.get(prevProps, "match.params.taxonOrNameKey") !==
      _.get(this.props, "match.params.taxonOrNameKey")
    ) {
      if (this.timer) {
        clearInterval(this.timer);
        delete this.timer;
      }

      this.getData(_.get(this.props, "match.params.taxonOrNameKey"));
    }
  }

  getData = attempt => {
    const {
      match: {
        params: { key: datasetKey }
      },
      updateImportState
    } = this.props;

    this.setState({ loading: true });
    const uri = attempt
      ? `${config.dataApi}dataset/${datasetKey}/import/${attempt}`
      : `${config.dataApi}dataset/${datasetKey}/import?limit=1`;
    axios(uri)
      .then(res => {
        const data = attempt ? res.data : res.data[0];
        return userLoader
        .load(data.createdBy)
        .then((user) => {
          data.user = user;
          return data
        })
      })
      .then(data => {
        
        if (data && ["processing", "downloading", "inserting", "analyzing"].includes(data.state)) {
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
        this.setState({ loading: false, data: data, hasNoImports: _.isUndefined(data), err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: null });
      });
  };

  getHistory = () => {
    const {
      match: {
        params: { key: datasetKey }
      },
      catalogueKey
    } = this.props;

   return axios(`${config.dataApi}dataset/${datasetKey}/import?limit=20`)
      .then(res => {
        return Promise.all(res.data.map((hist) =>
        userLoader
          .load(hist.createdBy)
          .then((user) => (hist.user = user))
          )  
      )
      .then(() => res)
      })
      .then(res => {
        const lastFinished = res.data.find(e => e.state === 'finished')
        if(!_.get(this.props, "match.params.taxonOrNameKey") && this.state.data && this.state.data.state === 'unchanged' && lastFinished){
          history.push(`/dataset/${datasetKey}/imports/${lastFinished.attempt}`)
        }
        this.setState({ importHistory: res.data, err: null });
      })
      .catch(err => {
        this.setState({ historyError: err, importHistory: null });
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
        params: { datasetKey, taxonOrNameKey: attempt }
      },
      catalogueKey
    } = this.props;

    const { dataset, user, origin, importState } = this.props;
    const { importHistory, loading, data } = this.state;

    return (
      
        <PageContent>
          
          {!loading && dataset && importHistory && importHistory.length === 0 && 
          <Alert style={{marginTop: '16px'}} 
            message={dataset.origin === 'managed' ? "This dataset has never been released." : `This dataset has never been imported.${Auth.isAuthorised(user, ["editor", "admin"]) ?  ' Press the import button to import it': ''}` } 
            type="warning" />}
          {importHistory && importHistory.length > 0 && (
            <Drawer
              title="Import history"
              placement="right"
              closable={false}
              onClose={this.hideHistoryDrawer}
              visible={this.state.historyVisible}
            >
              <ImportHistory importHistory={importHistory} attempt={attempt} catalogueKey={catalogueKey} />
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
          { dataset &&     
          <Row style={{ padding: "10px" }} type="flex" justify="end">
               
                
               
                <Col  style={{ textAlign: "right", marginRight: "8px" }}>
                
          {Auth.isAuthorised(user, ["editor", "admin"]) && <ArchiveUpload datasetKey={_.get(dataset, 'key')} origin={_.get(dataset, 'origin')} /> }

                </Col>
                <Col  style={{ textAlign: "right" }}>
                  
                  {Auth.isAuthorised(user, ["editor", "admin"]) &&    <ImportButton
                        style={{ display: "inline" }}
                        record={{datasetKey: dataset.key}}
                        onStartImportSuccess={() => this.getData(attempt)}
                        onDeleteSuccess={() => this.getData(attempt)}
                      />}
                    
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
              </Row>}
          {this.state.data && (
            <React.Fragment>
          <ImportMetrics data={this.state.data }/>
              
<Row style={{ padding: "10px" }}>
<Divider orientation="left">Details</Divider>
<PresentationItem label="State" >
{_.get(data, 'state')}
</PresentationItem>
<PresentationItem label="Created by" >
{_.get(data, 'user.username')}
</PresentationItem>
<PresentationItem label="Started" >
{moment(data.started).format("lll")}
</PresentationItem>
<PresentationItem label="Finished" >
{moment(data.finished).format("lll")}
</PresentationItem>
<PresentationItem label="Download uri" >
{_.get(data, 'downloadUri')}
</PresentationItem>
<PresentationItem label="Upload" >
                      
                        <BooleanValue
                          value={_.get(data, 'upload')}
                        ></BooleanValue>
                     
                    </PresentationItem>

</Row>


            </React.Fragment>
          )}
        </PageContent>
    );
  }
}
const mapContextToProps = ({ user, dataset, importState, catalogueKey }) => ({ user, dataset, importState, catalogueKey });

export default withContext(mapContextToProps)(DatasetImportMetrics);
