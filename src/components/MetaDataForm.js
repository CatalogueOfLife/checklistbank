import React from 'react';

import { Form, Input,  Select,  Button, Alert, notification } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import config from '../config';
import TextArea from 'antd/lib/input/TextArea';
import ErrorMsg from '../components/ErrorMsg';
import withContext from './hoc/withContext';

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description,
  });
};

class RegistrationForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      confirmDirty: false,
      autoCompleteResult: []
    };
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
    const { getFieldDecorator } = this.props.form;
   // const { submissionError, frequencyError, datasettypeError,dataformatError } = this.state;
    const { datasetoriginEnum, frequencyEnum , datasettypeEnum, dataformatEnum } = this.props;

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

    const { data } = this.props;

    return (

      
      <Form onSubmit={this.handleSubmit} style={{paddingTop: '12px'}}>
     { /*
      {submissionError && <FormItem><Alert message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
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
        <FormItem
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
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Import Frequency"
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
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Dataset Origin"
        >
          {getFieldDecorator('origin', {
            initialValue: (_.get(data, 'origin')) ? _.get(data, 'origin') : ''
          })(
            <Select style={{ width: 200 }}>
              {datasetoriginEnum.map((f) => {
                return <Option key={f} value={f}>{f}</Option>
              })}
            </Select>
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
          label="Home Page"
        >
          {getFieldDecorator('homepage', {
            initialValue: (_.get(data, 'homepage')) ? _.get(data, 'homepage') : '',
          
          })(
            <Input type="url" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Logo Url"
        >
          {getFieldDecorator('logoUrl', {
            initialValue: (_.get(data, 'logoUrl')) ? _.get(data, 'logoUrl') : '',
          
          })(
            <Input type="url" />
          )}
        </FormItem>
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
  datasetOrigin: datasetoriginEnum }) => ({
  addError,
  addInfo,
  frequencyEnum,
  datasettypeEnum,
  dataformatEnum,
  datasetoriginEnum
});

const WrappedRegistrationForm = Form.create()(withContext(mapContextToProps)(RegistrationForm));


export default WrappedRegistrationForm
