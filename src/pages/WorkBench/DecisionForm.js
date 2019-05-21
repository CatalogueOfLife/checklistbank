import React from "react";
import { Form, Input, Modal, Select, Alert, Checkbox } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const Option = Select.Option;
const FormItem = Form.Item;

const removeEmptyValues = (myObj) => {
    
    Object.keys(myObj).forEach((key) => {
        
        (typeof myObj[key] === 'undefined' || myObj[key] === ''  || myObj[key] === null ) && delete myObj[key]});

   
}

class DecisionForm extends React.Component {
  state = {
    visible: true,
    confirmLoading: false
  };

  handleSubmit = e => {
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
          recent: values.recent

        };
        removeEmptyValues(decision.name)
        removeEmptyValues(decision)

        if (
          this.props.onSuccess &&
          typeof this.props.onSuccess === "function"
        ) {
          this.props.onSuccess(decision);
        }
      } else {
      }
    });
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  render() {
    const {
      rank,
      nomstatus,
      nomCode,
      nametype,
      lifezone,
      onCancel,
      form: { getFieldDecorator }
    } = this.props;
    const { visible, submissionError } = this.state;
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
        style={{ width: "650px" }}
        title={<span>Decision</span>}
        visible={visible}
        onOk={() => {
          this.setState({ confirmLoading: true });
          this.handleSubmit();
        }}
        confirmLoading={this.state.confirmLoading}
        onCancel={() => {
          this.setState({ visible: false }, onCancel);
        }}
        destroyOnClose={true}
      >
        <Form>
        <FormItem {...formItemLayout} label="Scientific name">
            {getFieldDecorator("scientificName", {})(<Input />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Authorship">
            {getFieldDecorator("authorship", {})(<Input />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Rank">
            {getFieldDecorator("rank", {})(
              <Select style={{ width: 200 }} showSearch>
                {rank.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Name type">
            {getFieldDecorator("nametype", {})(
              <Select style={{ width: 200 }} showSearch>
                {nametype.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Nom. status">
            {getFieldDecorator("nomstatus", {})(
              <Select style={{ width: 200 }} showSearch>
                {nomstatus.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Nom. code">
            {getFieldDecorator("nomCode", {})(
              <Select style={{ width: 200 }} showSearch>
                {nomCode.map(r => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Lifezones">
            {getFieldDecorator("lifezones", {})(
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
          label="Fossil"
        >
          {getFieldDecorator('fossil', {
            valuePropName: 'checked'
            
          })(
            <Checkbox />

              
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Recent"
        >
          {getFieldDecorator('recent', {
            valuePropName: 'checked'
            
          })(
            <Checkbox />

              
          )}
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
      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus, nomCode, nametype, lifezone }) => ({
  rank,
  nomstatus,
  nomCode,
  nametype,
  lifezone
});
const WrappedDecisionForm = Form.create()(
  withContext(mapContextToProps)(DecisionForm)
);

export default WrappedDecisionForm;
