import React, { useState, useEffect } from "react";

import { Input, Button, Alert, Select, Form } from "antd";
import ErrorMsg from "../ErrorMsg";
import withContext from "../hoc/withContext";
import _ from "lodash";
const FormItem = Form.Item;
const Option = Select.Option;
const AgentForm = (props) => {
  // const [addNewMode, setAddNewMode] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (props.data) {
      form.setFieldsValue(props.data);
    } else {
      form.resetFields();
    }
  }, [props.data]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    props.onSubmit(values).then(() => {
      form.resetFields();
    });
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
      // initialValues={props.data}
      name="AgentForm"
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
      style={props.style}
    >
      <FormItem {...formItemLayout} label="Given name" name="given">
        <Input />
      </FormItem>
      <FormItem {...formItemLayout} label="Family name" name="family">
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
            const countryName =
              c.name.charAt(0).toUpperCase() + c.name.slice(1);
            return (
              <Option key={c.alpha2} value={c.alpha2}>
                {countryName}
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
        <Button type="primary" htmlType="submit">
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
const mapContextToProps = ({ country }) => ({
  country,
});

export default withContext(mapContextToProps)(AgentForm);
