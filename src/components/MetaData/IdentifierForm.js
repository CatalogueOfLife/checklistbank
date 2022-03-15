import React, { useState } from "react";

import { Input, Button, Alert, Form } from "antd";
import ErrorMsg from "../ErrorMsg";
import _ from "lodash";

const types = ["col", "plazi", "doi", "gbif"];
const FormItem = Form.Item;
const IdentifierForm = (props) => {
  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    props.onSubmit(values);
  };

  /*  const toggleEdit = () => {
    setAddNewMode(!addNewMode);
  }; */

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
        span: 8,
        offset: 16,
      },
    },
  };
  return (
    <Form
      form={form}
      initialValues={props.data}
      name="IdentifierForm"
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
      style={props.style}
    >
      {types.map((t) => (
        <FormItem {...formItemLayout} label={t.toUpperCase()} name={t}>
          <Input />
        </FormItem>
      ))}

      <FormItem {...tailFormItemLayout}>
        <Button style={{ marginRight: "10px" }} onClick={props.onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" onClick={() => form.submit()}>
          {props.data ? "Save" : "Add"}
        </Button>
      </FormItem>
      {submissionError && (
        <FormItem>
          <Alert
            closable
            onClose={() => setSubmissionError(null)}
            description={<ErrorMsg error={submissionError} />}
            type="error"
          />
        </FormItem>
      )}
    </Form>
  );
};

export default IdentifierForm;
