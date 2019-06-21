import React from 'react';

import { Form, Input,  Select,  Button, Alert, Row, Col, Rate, notification } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import config from '../../config';
import TextArea from 'antd/lib/input/TextArea';
import ErrorMsg from '../../components/ErrorMsg';
import TagControl from "../../components/TagControl"
import withContext from '../../components/hoc/withContext';


const types = {
    'book': {
        'typeLabel': 'Book'
    },
    'incollection': {
        'typeLabel': 'Chapter',
        'container-title': 'Book title',
        'title': 'Chapter title'
    }, 
    'paper-conference': {
        'typeLabel': 'Conference paper',
    }, 
    'article-journal': {
        'typeLabel': 'Journal article',
        'container-title': 'Journal'
    }, 
    'article-magazine': {
        'typeLabel': 'Magazine article',
        'container-title': 'Magazine'
    }, 
    'article-newspaper': {
        'typeLabel': 'Newspaper article',
        'container-title': 'Newspaper'
    }, 
    'webpage': {
        'typeLabel': 'Webpage',
        'container-title': 'Website'
    },
    'personal_communication': {
        'typeLabel': 'Personal communication',
    }
}

const getPages = (values) => {
    if(!isNaN(values.pagesFrom) && values.pagesFrom > 0 && !isNaN(values.pagesTo) && values.pagesTo > 0){
        return `${values.pagesFrom}-${values.pagesTo}`
    }
}

const getCslPersons = (values) => {
    if(_.isArray(values) && _.get(values, '[0]')) {

        return values.map(a => {
            const splitted = a.split(" ");
            if(splitted.length > 1){
                return {
                    family: splitted[splitted.length -1],
                    given: splitted.slice(0, -1).join(" ")
                }
            }
        })
    }
}

const getCslDate = (value) => {
    return value ? {
        'date-parts': value.split('-')
    } : "";
}

 // ['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine',  'article-newspaper', 'webpage', 'personal_communication' ]

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description  });
};

class RefForm extends React.Component {

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

        let csl = { 
            ..._.omit(values, ['pagesFrom', 'pagesTo']),
            pages: getPages(values), 
            author: getCslPersons(values.author), 
            editor: getCslPersons(values.editor), 
            issued: getCslDate(values.issued), 
            accessed: getCslDate(values.accessed) };
        
        console.log(JSON.stringify(csl, null, 2))
       this.submitData(csl);
      }
    });
  }

  submitData = (values)=> {

    const {datasetKey} = this.props; 
    const id =  _.get(this.props, 'data.id');
    const { onSaveSuccess } = this.props;
    let task = (id) ? axios.put(`${config.dataApi}dataset/${datasetKey}/reference/${id}`, values) : axios.post(`${config.dataApi}dataset/${datasetKey}/reference`, values);

    task
      .then((res) => {
        let title = (id) ? 'Reference updated' : 'Reference saved';
        let msg =  (id) ? `Data successfully updated for ${values.title}` : `${values.title} saved with id ${res.id}`
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
   const { submissionError, type } = this.state;
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
      {submissionError && <FormItem><Alert message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
     { /*
      
      {frequencyError && <FormItem><Alert message={<ErrorMsg error={frequencyError}></ErrorMsg>} type="error" /></FormItem>}
      {datasettypeError && <FormItem><Alert message={<ErrorMsg error={datasettypeError}></ErrorMsg>} type="error" /></FormItem>}
      {dataformatError && <FormItem><Alert message={<ErrorMsg error={dataformatError}></ErrorMsg>} type="error" /></FormItem>}
      */
     }
         <FormItem
          {...formItemLayout}
          label="Type"
        >
          {getFieldDecorator('type', {
            initialValue: (_.get(data, 'type')) ? _.get(data, 'type') : '',
            rules: [{
              required: true, message: 'Please select the reference type',
            }],
          })(
            <Select style={{ width: 200 }} onChange={(value)=> this.setState({type: value})}>
              {Object.keys(types).map((f) => {
                return <Option key={f} value={f}>{types[f].typeLabel}</Option>
              })}
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={_.get(types, `[${type}].title`) || 'Title'}
        >
          {getFieldDecorator('title', {
            initialValue: (_.get(data, 'title')) ? _.get(data, 'title') : '',
            rules: [{
              required: true, message: 'Please input title',
            }],
          })(
            <Input />
          )}
        </FormItem>

        


      { ['incollection',  'article-journal', 'article-magazine',  'article-newspaper' ].indexOf(type) > -1 &&  <FormItem
          {...formItemLayout}
          label={_.get(types, `[${type}].container-title`) || 'Container title'}
        >
          {getFieldDecorator('container-title', {
            initialValue: (_.get(data, 'container-title')) ? _.get(data, 'container-title') : '',
            rules: [{
              required: true, message: 'Please input container title',
            }],
          })(
            <Input />
          )}
        </FormItem> }





        <FormItem
          {...formItemLayout}
          label="Author(s)"
        >
          {getFieldDecorator('author', { initialValue: (_.get(data, 'author')) ? _.get(data, 'author') : [] })(
            <TagControl
              label="Add author"
              removeAll={true}
            />
          )}
        </FormItem>

        
        { ['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine',  'article-newspaper' ].indexOf(type) > -1 &&      <FormItem
          {...formItemLayout}
          label="Editor(s)"
        >
          {getFieldDecorator('editor', { initialValue: (_.get(data, 'editor')) ? _.get(data, 'editor') : [] })(
            <TagControl
              label="Add editor"
              removeAll={true}
            />
          )}
        </FormItem> }

        { [ 'paper-conference', 'article-journal'  ].indexOf(type) > -1 &&       <FormItem
          {...formItemLayout}
          label="Issue"
        >
          {getFieldDecorator('issue', {
            initialValue: (_.get(data, 'issue')) ? _.get(data, 'issue') : 1,

          })(
            <Input type="number" min="1" />
          )}
        </FormItem>}
        

        { ['book', 'incollection',  'article-magazine'].indexOf(type) > -1 &&   <FormItem
          {...formItemLayout}
          label="Edition"
        >
          {getFieldDecorator('edition', {
            initialValue: (_.get(data, 'edition')) ? _.get(data, 'edition') : 1,

          })(
            <Input type="number" min="1" />
          )}
        </FormItem> }

      { ['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine' ].indexOf(type) > -1 &&  <FormItem
          {...formItemLayout}
          label="Volume"
        >
          {getFieldDecorator('volume', {
            initialValue: (_.get(data, 'volume')) ? _.get(data, 'volume') : 1,

          })(
            <Input type="number" min="1" />
          )}
        </FormItem>}
     
     {['incollection', 'article-journal', 'article-magazine',  'article-newspaper' ].indexOf(type) > -1 &&  <FormItem
          {...formItemLayout}
          label="Pages"
        > <Row><Col span={6}>
          {getFieldDecorator('pagesFrom', {
            initialValue: (_.get(data, 'pagesFrom')) ? _.get(data, 'pagesFrom') : 1,

          })(
            <Input type="number"  style={{width: "90%"}}/>
          )}
          </Col>
          <Col span={6} >
          {getFieldDecorator('pagesTo', {
            initialValue: (_.get(data, 'pagesTo')) ? _.get(data, 'pagesTo') : 1,

          })(
            <Input type="number"  style={{width: "90%"}} />
          )}
          </Col>
          </Row>
        </FormItem>}

        {[ 'paper-conference'].indexOf(type) > -1 &&      <FormItem
          {...formItemLayout}
          label="Event (Conference)"
        >
          {getFieldDecorator('event', {
            initialValue: (_.get(data, 'event')) ? _.get(data, 'event') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}
        {['book', 'incollection', 'paper-conference' ].indexOf(type) > -1 &&     <FormItem
          {...formItemLayout}
          label="Publisher"
        >
          {getFieldDecorator('publisher', {
            initialValue: (_.get(data, 'publisher')) ? _.get(data, 'publisher') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}

        {['book', 'incollection',  'article-newspaper' ].indexOf(type) > -1 &&   <FormItem
          {...formItemLayout}
          label="Place"
        >
          {getFieldDecorator('publisher-place', {
            initialValue: (_.get(data, 'publisher-place')) ? _.get(data, 'publisher-place') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}

        {['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine',  'article-newspaper', 'webpage' ].indexOf(type) > -1 &&   <FormItem
          {...formItemLayout}
          label="URL"
        >
          {getFieldDecorator('URL', {
            initialValue: (_.get(data, 'URL')) ? _.get(data, 'URL') : "",

          })(
            <Input type="url"  />
          )}
        </FormItem>}
        {['paper-conference', 'article-journal' ].indexOf(type) > -1 &&   <FormItem
          {...formItemLayout}
          label="DOI"
        >
          {getFieldDecorator('DOI', {
            initialValue: (_.get(data, 'DOI')) ? _.get(data, 'DOI') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}

        {['book', 'incollection', 'paper-conference' ].indexOf(type) > -1 &&  <FormItem
          {...formItemLayout}
          label="ISBN"
        >
          {getFieldDecorator('ISBN', {
            initialValue: (_.get(data, 'ISBN')) ? _.get(data, 'ISBN') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}

        {['article-journal', 'article-magazine',  'article-newspaper' ].indexOf(type) > -1 &&  <FormItem
          {...formItemLayout}
          label="ISSN"
        >
          {getFieldDecorator('ISSN', {
            initialValue: (_.get(data, 'ISSN')) ? _.get(data, 'ISSN') : "",

          })(
            <Input type="text"  />
          )}
        </FormItem>}

        {['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine',  'article-newspaper', 'webpage', 'personal_communication' ].indexOf(type) > -1 &&    <FormItem
          {...formItemLayout}
          label="Issued"
        >
          {getFieldDecorator('issued', {
            initialValue: (_.get(data, 'issued')) ? _.get(data, 'issued') : "",

          })(
            <Input type="date"  />
          )}
        </FormItem>}

        {['book', 'incollection', 'paper-conference', 'article-journal', 'article-magazine',  'article-newspaper', 'webpage', 'personal_communication' ].indexOf(type) > -1 &&     <FormItem
          {...formItemLayout}
          label="Accessed"
        >
          {getFieldDecorator('accessed', {
            initialValue: (_.get(data, 'accessed')) ? _.get(data, 'accessed') : "",

          })(
            <Input type="date"  />
          )}
        </FormItem>}

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

const WrappedRefForm = Form.create()(withContext(mapContextToProps)(RefForm));


export default WrappedRefForm;
