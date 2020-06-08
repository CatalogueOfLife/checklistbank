import React from "react";
import {withRouter} from "react-router-dom"
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import {
  Row,
  Col,
  Alert,
  Switch,
  notification
} from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem"
import BooleanValue from "../../../components/BooleanValue"
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";





class DatasetSettings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      data: null,
      editMode: false
    };
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate = prevProps => {
    if (
      _.get(this.props, "datasetKey") !==
      _.get(prevProps, "datasetKey")
    ) {
      this.getData();
    }
  };

  getData = () => {
    const {
      datasetKey
    } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${datasetKey}/settings`)
    .then(res => {
      this.setState({ loading: false, data: res.data, err: null });
    })
      .catch(err => {
        this.setState({ loading: false, error: err, data: null });
      });
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  }



  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  }

  render() {
    const {
      error,
      data,
      editMode
    } = this.state;
    
    const { datasetSettings, datasetKey} = this.props;
    return (
      
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
            <Col span={4}>
            <h3>Settings</h3>
            </Col>
            <Col offset={18} span={2}>
            {data  && (
              <Switch
                checked={editMode}
                onChange={this.setEditMode}
                checkedChildren="Cancel"
                unCheckedChildren="Edit"
              />
            )}
            </Col>
            
          </Row>
          <Row>
            <Col span={24}>
            
            {editMode && (
          <DatasetSettingsForm
            data={data}
            datasetKey={datasetKey}
            onSaveSuccess={() => {
              this.setEditMode(false);
              this.getData();
            }}
          />
        )}
           {!editMode && data && 
           <div style={{marginRight: '28px'}}>
             {datasetSettings.filter(s => s.type === "Boolean").map(s => 
              <PresentationItem label={_.startCase(s.name)} key={s.name}>
              {_.get(data, s.name) === true || _.get(data, s.name) === false ? <BooleanValue value={_.get(data, s.name)}></BooleanValue> : ""}
            </PresentationItem>
            )}
        {datasetSettings.filter(s => s.type === "String" || s.type === "Integer").map(s => 
              <PresentationItem label={_.startCase(s.name)} key={s.name}>
              {_.get(data, s.name) === "\t" ? "<TAB>" : _.get(data, s.name)}
            </PresentationItem>
            )}
        {datasetSettings.filter(s => !["String", "Integer", "Boolean"].includes(s.type)).map(s => 
              <PresentationItem label={_.startCase(s.name)} key={s.name}>
              {_.get(data, s.name)}
            </PresentationItem>
            )}
             </div>} 


            </Col>
           

          </Row>

        </PageContent>
     
    );
  }
}

const mapContextToProps = ({  datasetSettings }) => ({
   datasetSettings
});
export default withContext(mapContextToProps)(withRouter(DatasetSettings));
