import React, { useState } from "react";

import { Input, Button, Alert, Select, Form } from "antd";
import ErrorMsg from "./ErrorMsg";
import withContext from "./hoc/withContext";
import _ from "lodash";
const FormItem = Form.Item;
const Option = Select.Option;
const AgentForm = (props) => {
  // const [addNewMode, setAddNewMode] = useState(false);
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
        span: 6,
        offset: 18,
      },
    },
  };
  return (
    <Form
      form={form}
      initialValues={props.data}
      name="AgentForm"
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
      style={props.style}
    >
      <FormItem {...formItemLayout} label="Given name" name="givenName">
        <Input />
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="Family name"
        name="familyName"
        /* rules={[
          {
            required: true,
            message: "familyName",
          },
        ]} */
      >
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="email" name="email">
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="ORCID" name="orcid">
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="Organisation" name="organisation">
        <Input />
      </FormItem>
      <FormItem {...formItemLayout} label="RORID" name="rorid">
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
        <Select
          style={{ width: 300 }}
          filterOption={(input, option) => {
            return option.children
              .toLowerCase()
              .startsWith(input.toLowerCase());
          }}
          showSearch
          allowClear
        >
          {props.country.map((c) => {
            return (
              <Option key={c.alpha2} value={c.alpha2}>
                {c.title}
              </Option>
            );
          })}
        </Select>
      </FormItem>

      <FormItem {...formItemLayout} label="Url (webpage)" name="url">
        <Input />
      </FormItem>

      <FormItem {...formItemLayout} label="Note" name="note">
        <Input />
      </FormItem>

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
            message={<ErrorMsg error={submissionError} />}
            type="error"
          />
        </FormItem>
      )}
    </Form>
  );
};
const mapContextToProps = ({ country }) => ({
  country,
});

export default withContext(mapContextToProps)(AgentForm);
