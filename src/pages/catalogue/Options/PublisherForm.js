import React, { useState, useEffect } from "react";
import Auth from "../../../components/Auth";
import {
  notification,
  Select,
  Checkbox,
  Input,
  Alert,
  Button,
  InputNumber,
  Form,
} from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import TaxonFormControl from "../../../components/TaxonFormControl";
import PublisherFormControl from "../../../components/PublisherFormControl";
import ErrorMsg from "../../../components/ErrorMsg";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";

import withContext from "../../../components/hoc/withContext";
const FormItem = Form.Item;

const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    xs: { span: 18 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 15 },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 4,
      offset: 19,
    },
  },
};

const PublisherForm = ({ publisher, onError, catalogueKey, onSubmit }) => {
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const selectedPublisher = Form.useWatch("publisher", form);

  useEffect(() => {}, [publisher]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    if (publisher?.id) {
      axios
        .put(
          `${config.dataApi}dataset/${catalogueKey}/sector/publisher/${publisher.id}`,
          {
            id: publisher?.id,
            title: values?.title || publisher?.title,
            alias: values?.alias,
            description: values?.description,
          }
        )
        .then(() => {
          notification.open({
            message: "Publisher updated",
            description: "Publisher updated",
          });
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(values);
          }
        })
        .catch((err) => {
          setError(err);
          if (typeof onError === "function") {
            onError(err);
          }
        });
    } else {
      axios
        .post(`${config.dataApi}dataset/${catalogueKey}/sector/publisher/`, {
          id: values?.publisher?.key,
          title: values?.title || values?.publisher?.title,
          alias: values?.alias,
          description: values?.description,
        })
        .then(() => {
          notification.open({
            message: "Publisher created",
            description: "Publisher created",
          });
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(values);
          }
        })
        .catch((err) => {
          setError(err);
          if (typeof onError === "function") {
            onError(err);
          }
        });
    }
  };

  const initialValues = {
    alias: publisher?.alias,
    publisher: { ...publisher },
    description: publisher?.description,
    title: publisher?.title,
  };
  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: "10px" }}
          description={<ErrorMsg error={error} />}
          type="error"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={submitData}
        onFinishFailed={onFinishFailed}
      >
        <FormItem
          {...formItemLayout}
          defaultPublisherKey={publisher?.id}
          label="GBIF publisher"
          key="publisher"
          name="publisher"
          required
        >
          <PublisherFormControl
            defaultPublisherKey={publisher?.id}
            disabled={!!publisher?.id}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Title"
          key="title"
          name="title"
          initialValue={selectedPublisher?.title}
          extra="If you leave this blank, the title from the GBIF registry will be used"
        >
          <Input />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Alias"
          key="alias"
          name="alias"
          required
        >
          <Input />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Description"
          key="description"
          name="description"
        >
          <TextArea />
        </FormItem>

        <FormItem {...tailFormItemLayout}>
          <Button type="primary" onClick={form.submit}>
            Save
          </Button>
        </FormItem>
      </Form>
    </>
  );
};

const mapContextToProps = ({
  nomCode,
  entitytype,
  rank,
  catalogueKey,
  nametype,
  nomstatus,
}) => ({
  catalogueKey,
  nomCode,
  entitytype,
  rank,
  nametype,
  nomstatus,
});
export default withContext(mapContextToProps)(PublisherForm);
