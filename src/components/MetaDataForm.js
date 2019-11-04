import React from 'react';

import { Form, Input,  Select,  Button, Alert, Checkbox, Rate, notification } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import config from '../config';
import TextArea from 'antd/lib/input/TextArea';
import ErrorMsg from '../components/ErrorMsg';
import TagControl from "./TagControl"
import ArchiveUpload from "./ArchiveUpload"
import withContext from './hoc/withContext';

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description  });
};

class RegistrationForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      confirmDirty: false,
      autoCompleteResult: [],
      origin: null

    };
  }
componentDidMount = () =>{
  this.setState({origin: _.get(this.props, 'data.origin')})
}

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        this.submitData(values);
      }
    });
  }

  submitData = (values)=> {

    const key =  _.get(this.props, 'data.key');
    const { onSaveSuccess } = this.props;
    let task = (key) ? axios.put(`${config.dataApi}dataset/${key}`, values) : axios.post(`${config.dataApi}dataset`, values);

    task
      .then((res) => {
        let title = (key) ? 'Meta data updated' : 'Dataset registered';
        let msg =  (key) ? `Meta data updated successfully updated for ${values.title}` : `${values.title} registered and ready for import`
        this.setState(
          { submissionError: null }, 
          ()=>{ 
            if(onSaveSuccess && typeof onSaveSuccess === 'function'){
              onSaveSuccess(res);
            }
            openNotification(title, msg)}
        )
      
      })
      .catch((err) => {
        this.setState({ submissionError: err })
      })
  }

  handleConfirmBlur = (e) => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  }


  render() {
   // const { submissionError, frequencyError, datasettypeError,dataformatError } = this.state;
   const { submissionError, origin } = this.state;
    const { data, datasetoriginEnum, frequencyEnum , datasettypeEnum, dataformatEnum, licenseEnum, nomCodeEnum, form: {getFieldDecorator} } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 20 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 16,
          offset: 4,
        },
      },
    };


    return (

      
      <Form onSubmit={this.handleSubmit} style={{paddingTop: '12px'}}>
      {submissionError && <FormItem>
        <Alert
          closable
          onClose={() => this.setState({ submissionError: null })}
          message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" />
          </FormItem>}
     { /*
      
      {frequencyError && <FormItem><Alert message={<ErrorMsg error={frequencyError}></ErrorMsg>} type="error" /></FormItem>}
      {datasettypeError && <FormItem><Alert message={<ErrorMsg error={datasettypeError}></ErrorMsg>} type="error" /></FormItem>}
      {dataformatError && <FormItem><Alert message={<ErrorMsg error={dataformatError}></ErrorMsg>} type="error" /></FormItem>}
      */
     }
        <FormItem
          {...formItemLayout}
          label="Title"
        >
          {getFieldDecorator('title', {
            initialValue: (_.get(data, 'title')) ? _.get(data, 'title') : '',
            rules: [{
              required: true, message: 'Please input dataset title',
            }],
          })(
            <Input />
          )}
        </FormItem>
        {data &&   <FormItem
          {...formItemLayout}
          label="Alias"
          help="Abbreviated or shortened memorable name of Source Database intended for easy use in day-to-day communications, as supplied by the custodian"
        >
          {getFieldDecorator('alias', {
            initialValue: (_.get(data, 'alias')) ? _.get(data, 'alias') : ''
          })(
            <Input />
          )}
        </FormItem> }
        {data &&    <FormItem
          {...formItemLayout}
          label="English name of the group"
          help="English name of the taxon covered by the Source Database"
        >
          {getFieldDecorator('group', {
            initialValue: (_.get(data, 'group')) ? _.get(data, 'group') : '',

          })(
            <Input />
          )}
        </FormItem>}

        <FormItem
          {...formItemLayout}
          label="License"
        >
          {getFieldDecorator('license', {
            initialValue: (_.get(data, 'license')) ? _.get(data, 'license') : '',
            rules: [{
              required: true, message: 'Please select a license',
            }],
          })(
            <Select style={{ width: 200 }}>
              {licenseEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Dataset Type"
        >
          {getFieldDecorator('type', {
            initialValue: (_.get(data, 'type')) ? _.get(data, 'type') : '',
            rules: [{
              required: true, message: 'Please select a dataset type',
            }],
          })(
            <Select style={{ width: 200 }}>
              {datasettypeEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Dataset Origin"
        >
          {getFieldDecorator('origin', {
            initialValue: (_.get(data, 'origin')) ? _.get(data, 'origin') : '',
            rules: [{
              required: true, message: 'Please select the dataset origin',
            }],
          })(
            <Select style={{ width: 200 }} onChange={(value)=> this.setState({origin: value})}>
              {datasetoriginEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
          )}
        </FormItem>
        {/* data && origin === "uploaded" &&
        <FormItem {...formItemLayout}
        label="Data upload" >
         
               <ArchiveUpload style={{ marginLeft: '12px', float: 'right' }} datasetKey={_.get(this.props, 'data.key')} />
             
            </FormItem> */}
        

       {(origin === 'external' || origin === 'uploaded') && <FormItem
          {...formItemLayout}
          label="Data Format"
        >
          {getFieldDecorator('dataFormat', {
            initialValue: (_.get(data, 'dataFormat')) ? _.get(data, 'dataFormat') : ''
          })(
            <Select style={{ width: 200 }}>
              {dataformatEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
          )}
        </FormItem>}
        {origin === 'external' &&  <FormItem
          {...formItemLayout}
          label="Data Access"
        >
          {getFieldDecorator('dataAccess', {
            initialValue: (_.get(data, 'dataAccess')) ? _.get(data, 'dataAccess') : '',
            rules: [{
              required: false, message: 'Please input the url to access data from',
            }],
          })(
            <Input type="url" />
          )}
        </FormItem>}
        {origin === 'external' &&  <FormItem
          {...formItemLayout}
          label="Automated Import Frequency"
        >
          {getFieldDecorator('importFrequency', {
            initialValue: (_.get(data, 'importFrequency')) ? _.get(data, 'importFrequency') : '',

            rules: [{
              required: true, message: 'Please select import frequency',
            }],
          })(
            <Select style={{ width: 200 }}>
              {frequencyEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
          )}
        </FormItem>}


       {/* Only to be shown on existing datasets */}
        {data &&<React.Fragment>
          <FormItem
          {...formItemLayout}
          label="Website"
        >
          {getFieldDecorator('website', {
            initialValue: (_.get(data, 'website')) ? _.get(data, 'website') : '',
          
          })(
            <Input type="url" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Version"
        >
          {getFieldDecorator('version', {
            initialValue: (_.get(data, 'version')) ? _.get(data, 'version') : '',
          
          })(
            <Input type="text" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Contact"
        >
          {getFieldDecorator('contact', {
            initialValue: (_.get(data, 'contact')) ? _.get(data, 'contact') : '',
          
          })(
            <Input type="text" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Organisations"
        >
          {getFieldDecorator('organisations', { initialValue: (_.get(data, 'organisations')) ? _.get(data, 'organisations') : [] })(
            <TagControl
              label="New organisation"
              removeAll={true}
            />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Authors and Editors"
        >
          {getFieldDecorator('authorsAndEditors', { initialValue: (_.get(data, 'authorsAndEditors')) ? _.get(data, 'authorsAndEditors') : [] })(
            <TagControl
              label="New person"
              removeAll={true}
            />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Description"
        >
          {getFieldDecorator('description', {
            initialValue: (_.get(data, 'description')) ? _.get(data, 'description') : ''
          })(
            <TextArea rows={6} />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Citation"
        >
          {getFieldDecorator('citation', {
            initialValue: (_.get(data, 'citation')) ? _.get(data, 'citation') : ''
          })(
            <Input type="text" />
          )}
        </FormItem>

        <FormItem
          {...formItemLayout}
          label="Logo Url"
        >
          {getFieldDecorator('logo', {
            initialValue: (_.get(data, 'logo')) ? _.get(data, 'logo') : '',
          
          })(
            <Input type="url" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Nomenclatural code"
        >
          {getFieldDecorator('code', {
            initialValue: (_.get(data, 'code')) ? _.get(data, 'code') : '',
          
          })(
            <Select style={{ width: 200 }}>
              {nomCodeEnum.map((c) => {
                return <Option key={c.name} value={c.name}>{`${c.name} (${c.acronym})`}</Option>
              })}
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Contributes to"
        >
          {getFieldDecorator('contributesTo', {
            initialValue: (_.get(data, 'contributesTo')) ? _.get(data, 'contributesTo') : '',
          
          })(
            <Select style={{ width: 200 }}>
            <Option key="col" value="col">col</Option>
            <Option key="pcat" value="pcat">pcat</Option>
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Geographic scope"
        >
          {getFieldDecorator('geographicScope', {
            initialValue: (_.get(data, 'geographicScope')) ? _.get(data, 'geographicScope') : '',
          
          })(
            <Input type="text" />
          )}
        </FormItem>
        

            <FormItem
          {...formItemLayout}
          label="Completeness"
          help="Percentage of completeness of species list of the taxon provided by the Source Database"
        >
          {getFieldDecorator('completeness', {
            initialValue: (_.get(data, 'completeness')) ? _.get(data, 'completeness') : 0,

          })(
            <Input type="number" min="0" max="100"/>
          )}
        </FormItem>
            <FormItem
          {...formItemLayout}
          label="Checklist Confidence"
          help={<span>Quality of taxonomic checklist with values 1 to 5; quality is stated by the custodian in agreement with CoL editor. Confidence indicators are described at <a href="http://www.catalogueoflife.org/col/info/databases" target="_blank">http://www.catalogueoflife.org/col/info/databases</a></span>}
        >
          {getFieldDecorator('confidence', {
            initialValue: (_.get(data, 'confidence')) ? _.get(data, 'confidence') : null,

          })(
            <Rate />
          )}
        </FormItem>
            <FormItem
          {...formItemLayout}
          label="Notes"
        >
          {getFieldDecorator('notes', {
            initialValue: (_.get(data, 'notes')) ? _.get(data, 'notes') : ''
          })(
            <TextArea rows={3} />
          )}
        </FormItem>
        </React.Fragment>}

        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">Save</Button>
        </FormItem>
      </Form>
    );
  }
}


const mapContextToProps = ({ addError, addInfo, frequency: frequencyEnum,
  datasetType: datasettypeEnum,
  dataFormatType: dataformatEnum,
  datasetOrigin: datasetoriginEnum,
  license: licenseEnum,
  nomCode: nomCodeEnum }) => ({
  addError,
  addInfo,
  frequencyEnum,
  datasettypeEnum,
  dataformatEnum,
  datasetoriginEnum,
  licenseEnum,
  nomCodeEnum
});

const WrappedRegistrationForm = Form.create()(withContext(mapContextToProps)(RegistrationForm));


export default WrappedRegistrationForm;
