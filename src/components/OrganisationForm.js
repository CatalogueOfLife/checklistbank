import React, { useState } from "react";

import { Input, Button, Alert, Form } from "antd";
import ErrorMsg from "./ErrorMsg";
import _ from "lodash";

const FormItem = Form.Item;

const OrganisationForm = (props) => {
  const [addNewMode, setAddNewMode] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    props.onSubmit(values);
  };

  const toggleEdit = () => {
    setAddNewMode(!addNewMode);
  };

  //  const { persons } = this.state;
  // const { visible, addNewMode, submissionError } = this.state;
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 19 },
    },
  };
  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 6,
        offset: 18,
      },
    },
  };
  return (
    <Form
      form={form}
      initialValues={props.data}
      name="OrganisationForm"
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
      style={props.style}
    >
      <FormItem {...formItemLayout} label="Name" name="name">
        <Input />
      </FormItem>
      <FormItem {...formItemLayout} label="Department" name="department">
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="City" name="city">
        <Input />
      </FormItem>
      <FormItem {...formItemLayout} label="State" name="state">
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="Country" name="country">
        <Input />
      </FormItem>

      <FormItem {...tailFormItemLayout}>
        <Button style={{ marginRight: "10px" }} onClick={props.onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" onClick={() => form.submit()}>
          Add
        </Button>
      </FormItem>
      {submissionError && (
        <FormItem>
          <Alert
            closable
            onClose={() => setSubmissionError(null)}
            message={<ErrorMsg error={submissionError} />}
            type="error"
          />
        </FormItem>
      )}
    </Form>
  );
};

export default OrganisationForm;
