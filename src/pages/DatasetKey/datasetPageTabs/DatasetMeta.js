import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { Switch, List, Row, Col, Select } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import PageContent from '../../../components/PageContent'
import { FormattedMessage } from 'react-intl'
import PresentationItem from '../../../components/PresentationItem'
import DeleteDatasetButton from './DeleteDatasetButton'
const Option = Select.Option;

class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.setEditMode = this.setEditMode.bind(this);
    this.onDatasetOriginChange = this.onDatasetOriginChange.bind(this)
    this.state = { data: null, editMode: false, datasetoriginEnum: [] };
  }

  componentWillMount() {
    this.getData();
    this.getDatasetOrigin();
  }

  getData = () => {
    const { id } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
      .then(res => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };
  getDatasetOrigin = () => {
    axios(`${config.dataApi}vocab/datasetorigin`)
      .then(res => {
        this.setState({
          datasetoriginEnum: res.data.map(e => e.name),
          datasetoriginError: null
        });
      })
      .catch(err => {
        this.setState({ datasetoriginEnum: [], datasetoriginError: err });
      });
  };
  setEditMode(checked) {
    this.setState({ editMode: checked });
  }


  onDatasetOriginChange = (value)=> {
    this.state.data.origin = value;
    const {data} = this.state;
    

    axios.put(`${config.dataApi}dataset/${data.key}`, data)
      .then((res) => {
        this.setState(
          {data}
        )
      
      })
      .catch((err) => {
        console.log(err)
      })
  }


  render() {

    const { data, editMode, datasetoriginEnum } = this.state;

    const listData = _.map(data, function(value, key) {
      return { key: _.startCase(key), value: value };
    });
    return (
      <PageContent>
        <Row>
          
          <Col lg={4} md={24}>
            <LogoUpload datasetKey={this.props.id} />
          </Col>
          <Col lg={8} md={24}>
            
          </Col>
          <Col lg={8} md={24} >
         
         { data &&    <Select style={{ width: 200, float: 'right' }} onChange={this.onDatasetOriginChange} defaultValue={_.get(data, 'origin')}>
               {datasetoriginEnum.map((f) => {
                 return <Option key={f} value={f}>Origin: {f}</Option>
               })}
             </Select>}
           
          
             {_.get(data, 'origin') === "uploaded" && (
               <ArchiveUpload style={{ marginLeft: '12px', float: 'right' }} datasetKey={this.props.id} />
             )}
           </Col>

        </Row>
        <Row>
        <Col lg={4} md={24}/>
        <Col lg={14} md={24}>
            {data && data.origin !== "external" && (
              <Switch
                checked={editMode}
                onChange={this.setEditMode}
                checkedChildren="Cancel"
                unCheckedChildren="Edit"
              />
            )}
          </Col>
          <Col lg={4} md={24}>
         { data && <DeleteDatasetButton record={data}></DeleteDatasetButton>}

          </Col>
          
        </Row>

        {editMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
            }}
          />
        )}
        {!editMode && (
          <dl>
            {listData.map((obj)=> <PresentationItem label={<FormattedMessage id={obj.key} defaultMessage={obj.key} />} >
            {obj.value}
          </PresentationItem>)}
          
          </dl>
        )}
      </PageContent>
    );
  }
}

export default DatasetMeta;
