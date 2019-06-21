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
import ImportButton from "../../Imports/importTabs/ImportButton";

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
      if(!res.data.contributesTo){
        res.data.contributesTo = []
      }
      return Promise.all([
        res.data,
        axios(`${config.dataApi}user/${createdBy}`),
        axios(`${config.dataApi}user/${modifiedBy}`),
        Promise.all(res.data.contributesTo.map(c => axios(`${config.dataApi}dataset/${c}`)))
      ])
    })
      .then(res => {
        res[0].createdByUser = _.get(res[1], 'data.username'),
        res[0].modifiedByUser = _.get(res[2], 'data.username'),
        res[0].contributesToDatasets = res[3].map(d => _.get(d, "data.title"))
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
        
         
               <ArchiveUpload style={{ marginLeft: '12px', float: 'right' }} datasetKey={_.get(this.state, 'data.key')} />
             
        }
          </Col>
          <Col span={2} offset={18}>
          { data && <DeleteDatasetButton record={data}></DeleteDatasetButton>}
          { data && <ImportButton
                        style={{ marginTop: "8px" }}
                        record={{datasetKey: data.key}}
                       
          /> }
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
          <React.Fragment>
            <PresentationItem label={<FormattedMessage id="alias" defaultMessage="Alias" />}>
            {data.alias}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="group" defaultMessage="Taxonomic Group" />}>
            {data.group}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="description" defaultMessage="Description" />}>
            {data.description}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="citation" defaultMessage="Citation" />}>
            {data.citation}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="type" defaultMessage="Type" />}>
            {data.type}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="contact" defaultMessage="Contact" />}>
            {data.contact}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="authors" defaultMessage="Authors" />}>
            {data.authors}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="organisations" defaultMessage="Organisations" />}>
            {data.organisations}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="released" defaultMessage="Released" />}>
            {data.released}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="version" defaultMessage="Version" />}>
            {data.version}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="license" defaultMessage="License" />}>
            {data.license}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="website" defaultMessage="Website" />}>
            {data.website && <a href={data.website} target="_blank" >{data.website}</a>}

          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="origin" defaultMessage="Origin" />}>
            {data.origin === 'external' && `${data.dataFormat}: ${data.dataAccess}`}
            {data.origin !== 'external' && data.origin}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="code" defaultMessage="Code" />}>
            {data.code}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Checklist Confidence" defaultMessage="Checklist Confidence" />} >
          {<Rate value={data.confidence} disabled></Rate>}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="completeness" defaultMessage="Completeness" />}>
            {data.completeness}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="contributesTo" defaultMessage="Contributes To" />}>
            {data.contributesToDatasets}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="gbifKey" defaultMessage="GBIF Key" />}>
            {data.gbifKey && <a href={`https://www.gbif.org/dataset/${data.gbifKey}`} target="_blank" >{data.gbifKey}</a>}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="importFrequency" defaultMessage="Import Frequency" />}>
            {data.importFrequency}
          </PresentationItem>

          
          <PresentationItem label={<FormattedMessage id="created" defaultMessage="Created" />}>
          {`${moment(data.created).format('MMMM Do YYYY, h:mm:ss a')} by ${data.createdByUser}`}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="modified" defaultMessage="Modified" />}>
          {`${moment(data.modified).format('MMMM Do YYYY, h:mm:ss a')} by ${data.modifiedByUser}`}
          </PresentationItem>
          
          </React.Fragment> )}
        
        
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, datasetOrigin : datasetoriginEnum, setDataset }) => ({ user, datasetoriginEnum, setDataset });

export default withContext(mapContextToProps)(DatasetMeta);
