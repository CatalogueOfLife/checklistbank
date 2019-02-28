import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { Switch, Rate, Row, Col, Select } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import PageContent from '../../../components/PageContent'
import { FormattedMessage } from 'react-intl'
import PresentationItem from '../../../components/PresentationItem'
import DeleteDatasetButton from './DeleteDatasetButton'
import withContext from '../../../components/hoc/withContext'
import Auth from '../../../components/Auth'
import moment from 'moment'
const Option = Select.Option;

class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null, editMode: false };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { id, setDataset } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
    .then(res => {
      const {createdBy, modifiedBy} = res.data;
      setDataset(res.data)
      return Promise.all([
        res.data,
        axios(`${config.dataApi}user/${createdBy}`),
        axios(`${config.dataApi}user/${modifiedBy}`)
      ])
    })
      .then(res => {
        res[0].createdByUser = _.get(res[1], 'data.username'),
        res[0].modifiedByUser = _.get(res[2], 'data.username'),
        this.setState({ loading: false, data: res[0], err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  }



  render() {

    const { data, editMode } = this.state;
    const {  user } = this.props;
    const listData = _.map(data, function(value, key) {
      return { key, value };
    });
    return (
      <PageContent>
      { Auth.isAuthorised(user, ['editor', 'admin']) && 
      <React.Fragment>
      <Row>
          
          <Col span={4}>
            <LogoUpload datasetKey={this.props.id} />
            {data && _.get(data, 'origin') === "uploaded" &&
        
         
               <ArchiveUpload style={{ marginLeft: '12px', float: 'right' }} datasetKey={_.get(this.props, 'data.key')} />
             
        }
          </Col>
          <Col span={2} offset={18}>
          { data && <DeleteDatasetButton record={data}></DeleteDatasetButton>}
          </Col>
        </Row> 
        <Row>
        
        <Col span={2} offset={22}>
            {data &&  (
              <Switch
                checked={editMode}
                onChange={this.setEditMode}
                checkedChildren="Cancel"
                unCheckedChildren="Edit"
              />
            )}

          </Col>
       
        </Row> </React.Fragment>}

        {editMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
              this.getData();
            }}
          />
        )}
        {!editMode && data && (
          <dl>
            {listData.filter((o)=> ['created', 'modified', 'imported' ].includes(o.key)).map((obj)=> <PresentationItem key={obj.key} label={<FormattedMessage id={obj.key} defaultMessage={_.startCase(obj.key)} />} >
            {moment(obj.value).format('MMMM Do YYYY, h:mm:ss a')}
          </PresentationItem>)}
            {listData.filter((o)=> !['createdBy', 'modifiedBy', 'created', 'modified', 'imported', 'confidence' ].includes(o.key)).map((obj)=> <PresentationItem key={obj.key} label={<FormattedMessage id={obj.key} defaultMessage={_.startCase(obj.key)} />} >
            {obj.value}
          </PresentationItem>)}
          <PresentationItem label={<FormattedMessage id="Checklist Confidence" defaultMessage="Checklist Confidence" />} >
          {<Rate value={data.confidence} disabled></Rate>}
          </PresentationItem>
          </dl>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, datasetOrigin : datasetoriginEnum, setDataset }) => ({ user, datasetoriginEnum, setDataset });

export default withContext(mapContextToProps)(DatasetMeta);
