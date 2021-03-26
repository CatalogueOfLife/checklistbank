import React, { useState, useEffect } from "react";

import {
  Input,
  Row,
  Col,
  Alert,
  Steps,
  Button,
  Radio,
  Upload,
  Form,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

import Helmet from "react-helmet";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const { TextArea } = Input;
const Step = Steps.Step;

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailLayout = {
  wrapperCol: {
    offset: 4,
    span: 16,
  },
};

// http://api.catalogueoflife.org/parser/metadata?url=https://raw.githubusercontent.com/CatalogueOfLife/coldp/master/metadata.yaml

const MetaDataValidator = () => {
  const [validatorResult, setValidatorResult] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [type, setType] = useState("YAML");
  const [form] = Form.useForm();
  const customRequest = (options) => {
    const config = {
      headers: {
        "Content-Type": type === "EML" ? "application/xml" : "text/yaml",
      },
    };
    return axios
      .post(options.action, options.file, config)
      .then((res) => {
        options.onSuccess(res.data, options.file);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const validateFromUrl = (url) => {
    return axios(`${config.dataApi}parser/metadata?url=${url}&format=${type}`)
      .then((res) => {
        setValidatorResult(res.data);
      })
      .catch((err) => setSubmissionError(err));
  };

  const validateFromYaml = (yaml) => {
    const bodyFormData = new FormData();
    bodyFormData.append("metadata", yaml);

    return axios
      .post(`${config.dataApi}parser/metadata`, bodyFormData, {
        headers: { "Content-Type": "text/yaml" },
      })
      .then((res) => {
        setValidatorResult(res.data);
      })
      .catch((err) => setSubmissionError(err));
  };

  const onFinish = (values) => {
    if (values.url) {
      validateFromUrl(values.url);
    } else if (values.yaml) {
      validateFromYaml(values.yaml);
    }
  };
  const onFinishFailed = (err) => {
    setSubmissionError(err);
  };
  const onTypeChange = (e) => {
    setType(e.target.value);
  };
  return (
    <Layout
      selectedKeys={["metadatavalidator"]}
      openKeys={["tools"]}
      title="Metadata Validator"
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>COL Options</title>
        <link rel="canonical" href="http://data.catalogueoflife.org" />
      </Helmet>
      <PageContent>
        <Steps
          current={validatorResult ? 1 : 0}
          style={{ marginBottom: "24px" }}
          onChange={(current) => setValidatorResult(null)}
        >
          <Step title={"Upload or enter Metadata"} />
          <Step title={"Review validation result"} disabled />
        </Steps>
        {submissionError && (
          <Alert
            type="error"
            closable
            onClose={() => setSubmissionError(null)}
            message={
              <ErrorMsg
                error={submissionError}
                style={{ marginBottom: "10px" }}
              />
            }
          ></Alert>
        )}
        {!validatorResult && (
          <React.Fragment>
            <FormItem {...formItemLayout} label={`Data type`}>
              <Radio.Group
                options={[
                  { label: "YAML", value: "YAML" },
                  { label: "EML", value: "EML" },
                ]}
                onChange={onTypeChange}
                value={type}
                optionType="button"
                buttonStyle="solid"
              />
            </FormItem>
            <FormItem {...formItemLayout} label={`Upload ${type} file`}>
              <Upload
                name="yamlfile"
                action={`${config.dataApi}parser/metadata`}
                accept=".yaml"
                customRequest={customRequest}
                onSuccess={setValidatorResult}
              >
                <Button icon={<UploadOutlined />}>Click to upload</Button>
              </Upload>
            </FormItem>
            <Row style={{ marginBottom: "20px" }}>
              <Col offset={4}>OR</Col>
            </Row>

            <Form
              form={form}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
            >
              <FormItem {...formItemLayout} label={`Url to ${type}`} name="url">
                <Input
                  placeholder="https://raw.githubusercontent.com/CatalogueOfLife/coldp/master/metadata.yaml"
                  type="url"
                ></Input>
              </FormItem>
              <Row style={{ marginBottom: "20px" }}>
                <Col offset={4}>OR</Col>
              </Row>
              <FormItem {...formItemLayout} label={`Enter ${type}`} name="yaml">
                <TextArea rows={10}></TextArea>
              </FormItem>
              <Form.Item {...tailLayout}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </React.Fragment>
        )}
        {validatorResult && (
          <pre>{JSON.stringify(validatorResult, null, 2)}</pre>
        )}
      </PageContent>
    </Layout>
  );
};

export default MetaDataValidator;
