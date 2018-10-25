import React from 'react';

import { Form, Input, Select, Button, Alert, notification, DatePicker } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import config from '../config';
import TextArea from 'antd/lib/input/TextArea';
import ErrorMsg from './ErrorMsg';
import moment from 'moment'

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description,
  });
};

class ColSourceMetaDataForm extends React.Component {

  constructor(props) {
    super(props);
    this.submitData = this.submitData.bind(this);

    this.state = {
      confirmDirty: false,
      autoCompleteResult: [],
      datasettypeEnum: []
    };
  }

  componentWillMount() {
    this.getDatasetType();
  }


  getDatasetType = () => {

    axios(`${config.dataApi}/vocab/datasettype`)
      .then((res) => {
        this.setState({ datasettypeEnum: res.data, datasettypeError: null })
      })
      .catch((err) => {
        this.setState({ datasettypeEnum: [], datasettypeError: err })
      })

  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        Object.keys(values).forEach((key) => (values[key] === '') && delete values[key]);

        values.datasetKey = _.get(this.props, 'data.datasetKey')
        if(values.released){
          values.released = moment(values.released).format('YYYY-MM-DD');
        }
        if(values.authorsAndEditors){
          values.authorsAndEditors = [values.authorsAndEditors]
        } else {
          values.authorsAndEditors = []
        }
        console.log('Received values of form: ', values);
        this.submitData(values);
      }
    });
  }

  submitData = (values) => {

    const key = _.get(this.props, 'data.key');
    const { onSaveSuccess } = this.props;
    let task = (key) ? axios.put(`${config.dataApi}colsource/${key}`, values) : axios.post(`${config.dataApi}colsource`, values);

    task
      .then((res) => {
        let title = (key) ? 'Meta data updated' : 'Col Source created';
        let msg = (key) ? `Meta data updated successfully updated for ${values.title} (${values.alias})` : `${values.title} (${values.alias}) registered and ready for import`
        this.setState(
          { submissionError: null },
          () => {
            if (onSaveSuccess && typeof onSaveSuccess === 'function') {
              onSaveSuccess();
            }
            openNotification(title, msg)
          }
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
    const { datasettypeEnum, submissionError } = this.state;

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


      <Form onSubmit={this.handleSubmit} style={{ paddingTop: '12px' }}>

        {submissionError && <FormItem><Alert message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}

        <FormItem
          {...formItemLayout}
          label="Source ID"
          help="A unique ID assigned to the dataset by the CoL software"
        >
          {getFieldDecorator('key', {
            initialValue: (_.get(data, 'key')) ? _.get(data, 'key') : '',
          })(
            <Input disabled/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Full Name"
          help="Full title of Source Database, as it is supplied by the custodian"
        >
          {getFieldDecorator('title', {
            initialValue: (_.get(data, 'title')) ? _.get(data, 'title') : '',
            rules: [{
              required: true, message: 'Please input source title',
            }],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Short Name"
          help="Abbreviated or shortened memorable name of Source Database intended for easy use in day-to-day communications, as supplied by the custodian"
        >
          {getFieldDecorator('alias', {
            initialValue: (_.get(data, 'alias')) ? _.get(data, 'alias') : '',
            rules: [{
              required: true, message: 'Please input source alias',
            }],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Version"
          help="Number or code, plus date, where Month and Year are obligatory) provided by the custodian; style specified by the CoL editor and custodian of Source Database"
        >
          {getFieldDecorator('version', {
            initialValue: (_.get(data, 'version')) ? _.get(data, 'version') : '',

          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Release Date"
          help="Original date (Year-Month-Date) of issue of the version for the Catalogue of Life"
        >
          {getFieldDecorator('released', {
            initialValue: (_.get(data, 'released')) ? moment(_.get(data, 'released')) : undefined,

          })(
            <DatePicker  />

          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Authors/Editors"
          help="Name(s) of Source Database editor or author; as specified by the custodian"
        >
          {getFieldDecorator('authorsAndEditors', {
            initialValue: (_.get(data, 'authorsAndEditors[0]')) ? _.get(data, 'authorsAndEditors[0]') : '',

          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Coverage"
          help="Global vs regional sources"
        >
          {getFieldDecorator('coverage', {
            initialValue: (_.get(data, 'coverage')) ? _.get(data, 'coverage') : ''
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
          label="English name of the group"
          help="English name of the taxon covered by the Source Database"
        >
          {getFieldDecorator('group', {
            initialValue: (_.get(data, 'group')) ? _.get(data, 'group') : '',

          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Abstract"
          help="Standardised short database description (text of 80-90 words) for use in the Catalogue of Life and supporting materials, such as the booklet published with the Annual Checklis"
        >
          {getFieldDecorator('description', {
            initialValue: (_.get(data, 'description')) ? _.get(data, 'description') : ''
          })(
            <TextArea rows={6} />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Organisation"
          help="Name of the Organisation that hosts the Source Database"
        >
          {getFieldDecorator('organisation', {
            initialValue: (_.get(data, 'organisation')) ? _.get(data, 'organisation') : '',

          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Home Page"
          help="Internet address of the project/resource website"
        >
          {getFieldDecorator('homepage', {
            initialValue: (_.get(data, 'homepage')) ? _.get(data, 'homepage') : '',

          })(
            <Input type="url" />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Contact person"
          help="Contact person of the source"
        >
          {getFieldDecorator('contactPerson', {
            initialValue: (_.get(data, 'contactPerson')) ? _.get(data, 'contactPerson') : '',

          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Bibliographic Citation"
          help="Full bibliographic citation to be used, filled automatically by the software."
        >
          {getFieldDecorator('citation', {
            initialValue: (_.get(data, 'citation')) ? _.get(data, 'citation') : '',

          })(
            <Input disabled/>
          )}
        </FormItem>





        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">Save</Button>
        </FormItem>
      </Form>
    );
  }
}

const WrappedColSourceMetaDataForm = Form.create()(ColSourceMetaDataForm);

export default WrappedColSourceMetaDataForm
