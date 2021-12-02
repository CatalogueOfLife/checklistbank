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
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import MetaDataForm from "../../components/MetaData/MetaDataForm";
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
  const [data, setData] = useState({ key: -1 });
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [type, setType] = useState("YAML");
  const [form] = Form.useForm();
  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "Content-Type": type === "EML" ? "application/xml" : "text/yaml",
      },
    };
    return axios
      .post(options.action, options.file, reqConfig)
      .then((res) => {
        options.onSuccess(res.data, options.file);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const validateFromMetadataForm = (values) => {
    const bodyFormData = new FormData();
    const json = JSON.stringify(values);
    bodyFormData.append("metadata", json);

    return axios
      .post(`${config.dataApi}parser/metadata`, bodyFormData, {
        headers: { "Content-Type": "application/json", Accept: "text/yaml" },
      })
      .then((res) => {
        setValidatorResult(res.data);
        makeFile(res.data);
      })
      .catch((err) => setSubmissionError(err));
  };

  const makeFile = function (text) {
    const blob = new Blob([text], { type: "text/plain" });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (downloadUrl !== null) {
      setDownloadUrl(null);
      window.URL.revokeObjectURL(downloadUrl);
    }
    return setDownloadUrl(window.URL.createObjectURL(blob));
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
      // selectedKeys={["metadatavalidator"]}
      // openKeys={["tools"]}
      title="Metadata Generator"
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>COL Metadata Generator</title>
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
          <MetaDataForm
            saveButtonLabel="Validate"
            data={data}
            onSaveSuccess={(res) => {
              setData({ key: -1, ...res });
              validateFromMetadataForm(res);
            }}
          />
        )}
        {validatorResult && (
          <>
            {downloadUrl && (
              <Button
                type="primary"
                href={downloadUrl}
                download={`metadata.yaml`}
                style={{ marginRight: "10px" }}
              >
                <DownloadOutlined /> Download
              </Button>
            )}
            <pre>{validatorResult}</pre>
          </>
        )}
      </PageContent>
    </Layout>
  );
};

export default MetaDataValidator;
