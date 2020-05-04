import React from "react";
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {
  Input,
  Modal,
  Select,
  Alert,
  Checkbox,
  AutoComplete,
  Row,
  Col,
  Steps,
  notification,
} from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const { Step } = Steps;

const Option = Select.Option;
const FormItem = Form.Item;
const {TextArea} = Input;

const removeEmptyValues = (myObj) => {
    
    Object.keys(myObj).forEach((key) => {
        
        (typeof myObj[key] === 'undefined' || myObj[key] === ''  || myObj[key] === null ) && delete myObj[key]});

   
}

class DecisionForm extends React.Component {
  state = {
    error: null,
    visible: true,
    confirmLoading: false,
    current: 0
  };

  handleSubmit = (current, cb) => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
        const decision = {
          name: {
            scientificName: values.scientificName,
            authorship: values.authorship,
            rank: values.rank,
            nomstatus: values.nomstatus,
            code: values.nomCode,
            type: values.nametype
          },
          lifezones: values.lifezones,
          status: values.status,
          fossil: values.fossil,
          recent: values.recent,
          note: values.note

        };
        removeEmptyValues(decision.name)
        if(_.isEmpty(decision.name, true)){
          delete decision.name
        };
        removeEmptyValues(decision)

        if (
          !_.isEmpty(decision, true)
        ) {
          this.applyDecision(decision)
          .then(()=> this.setState({current}, cb))
          .catch(()=> {
            this.setState({current})
          });
        } else {
          this.setState({current}, cb)
        }
      } else {
      }
    });
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };
  applyDecision = (decisionObjectFromForm) => {
    
    const { datasetKey, subjectDatasetKey, rowsForEdit, onSaveDecision } = this.props;
    const {current} = this.state;
    const currentRow = rowsForEdit[current];

    const currentDecision = _.get(currentRow, 'decisions[0]' );

        let decisionObject;
        
          decisionObject = {...decisionObjectFromForm}
          decisionObject.mode = 'update';
          decisionObject.subjectDatasetKey = Number(subjectDatasetKey);
          decisionObject.datasetKey = Number(datasetKey);
          decisionObject.subject = {
            id: _.get(currentRow, "usage.id"),

            name: _.get(currentRow, "usage.name.scientificName"),
            authorship: _.get(currentRow, "usage.name.authorship"),
            rank: _.get(currentRow, "usage.name.rank"),
            status: _.get(currentRow, "usage.status"),
            parent: (currentRow.classification && currentRow.classification.length > 1) ? currentRow.classification[currentRow.classification.length - 2].name : "",
            code: _.get(currentRow, "usage.name.code")
          }
        
        
         const method = currentDecision ? 'put' : 'post';
        return axios[method](`${config.dataApi}dataset/${datasetKey}/decision${currentDecision ? '/'+currentDecision.id : ''}`, decisionObject)
          .then(onSaveDecision)
          .then(res => {
            this.props.form.resetFields()
            notification.open({
              message: `Decision ${currentDecision ? 'updated':'applied'}`
            });
          })
          .catch(err => {
            this.props.form.resetFields()

            this.setState({error: err})
          });
      

  };

  render() {
    const {
      rank,
      nomstatus,
      nomCode,
      nametype,
      lifezone,
      taxonomicstatus,
      onCancel,
      onOk,
      rowsForEdit,
      form: { getFieldDecorator }
    } = this.props;
    const { visible, submissionError, current, error } = this.state;

    const currentRow = rowsForEdit[current];
    const currentDecision = _.get(rowsForEdit[current], 'decisions[0]' );

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };
    return (
      <Modal
        width="90%"
        title={<span>Decision</span>}
        visible={visible}
        onOk={() => {
          this.handleSubmit(this.state.current, onOk)
         // this.setState({ visible: false }, onOk)
        }}
        confirmLoading={this.state.confirmLoading}
        onCancel={() => {
          this.setState({ visible: false }, onCancel);
        }}
        destroyOnClose={true}
      >
        <Row>
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              message={<ErrorMsg error={error} />}
              closable
              type="error"
            />
          )}
        </Row>
        <Row>
        <Col span={16}>
        
        <Form>
        <FormItem {...formItemLayout} label="Scientific name">
            {getFieldDecorator("scientificName", {
                          initialValue: (_.get(currentDecision, 'name.scientificName')) ? _.get(currentDecision, 'name.scientificName') : ''

            })(<AutoComplete dataSource={_.get(currentRow, `usage.name.scientificName`) ? [_.get(currentRow, `usage.name.scientificName`)] : []} />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Authorship">
            {getFieldDecorator("authorship", { initialValue: (_.get(currentDecision, 'name.authorship')) ? _.get(currentDecision, 'name.authorship') : ''
})(<AutoComplete dataSource={_.get(currentRow, `usage.name.authorship`) ? [_.get(currentRow, `usage.name.authorship`)] : []} />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Rank">
            {getFieldDecorator("rank", {initialValue: (_.get(currentDecision, 'name.rank')) ? _.get(currentDecision, 'name.rank') : ""})(
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                    -
                  </Option>
                {rank.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Taxonomic status">
            {getFieldDecorator("status", {initialValue: (_.get(currentDecision, 'status')) ? _.get(currentDecision, 'status') : ""})(
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                    -
                  </Option>
                {taxonomicstatus.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Name type">
            {getFieldDecorator("nametype", {initialValue: (_.get(currentDecision, 'name.type')) ? _.get(currentDecision, 'name.type') : ''})(
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                    -
                  </Option>
                {nametype.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Nom. status">
            {getFieldDecorator("nomstatus", {initialValue: (_.get(currentDecision, 'name.nomstatus')) ? _.get(currentDecision, 'name.nomstatus') : ''})(
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                    -
                  </Option>
                {nomstatus.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Nom. code">
            {getFieldDecorator("nomCode", {initialValue: (_.get(currentDecision, 'name.nomCode')) ? _.get(currentDecision, 'name.nomCode') : ''})(
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                    -
                  </Option>
                {nomCode.map(r => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Lifezones">
            {getFieldDecorator("lifezones", {initialValue: (_.get(currentDecision, 'lifezones')) ? _.get(currentDecision, 'lifezones') : []})(
              <Select style={{ width: 200 }} showSearch mode="multiple">
                {lifezone.map(r => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem
          {...formItemLayout}
          label="Extinct"
        >
          {getFieldDecorator('extinct', {
            valuePropName: 'checked',
            initialValue: (_.get(currentDecision, 'extinct')) === true ? true : false
            
          })(
            <Checkbox />

              
          )}
        </FormItem>

        <FormItem {...formItemLayout} label="Note">
            {getFieldDecorator("note", {initialValue: (_.get(currentDecision, 'note')) ? _.get(currentDecision, 'note') : ''})(<TextArea />)}
          </FormItem>
          {submissionError && (
            <FormItem>
              <Alert
                message={<ErrorMsg error={submissionError} />}
                type="error"
              />
            </FormItem>
          )}
        </Form>
        
        </Col>
      <Col span={7} style={{marginLeft: '20px'}}>
    { rowsForEdit && rowsForEdit.length > 1 && <Steps 
      type="navigation"
      onChange={this.handleSubmit}
       
      current={current} direction="vertical">
        {rowsForEdit.map(r => <Step title="" description={_.get(r, 'usage.name.scientificName')} />)}
    </Steps>}
    </Col>
        </Row>

      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus, nomCode, nametype, lifezone, taxonomicstatus }) => ({
  rank,
  nomstatus,
  nomCode,
  nametype,
  lifezone,
  taxonomicstatus
});
const WrappedDecisionForm = Form.create()(
  withContext(mapContextToProps)(DecisionForm)
);

export default WrappedDecisionForm;
