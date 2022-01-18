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
  Tabs,
  Modal,
} from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import MetaDataForm from "../../components/MetaData/MetaDataForm";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import { withRouter } from "react-router-dom";
import history from "../../history";
import PageContent from "../../components/PageContent";
import _ from "lodash";
import axios from "axios";
import qs from "query-string";
import config from "../../config";

const { TextArea } = Input;
const Step = Steps.Step;
const { TabPane } = Tabs;
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

const CONTENT_TYPES = {
  JSON: "application/json",
  YAML: "text/yaml",
  EML: "application/xml",
};

// http://api.catalogueoflife.org/parser/metadata?url=https://raw.githubusercontent.com/CatalogueOfLife/coldp/master/metadata.yaml

const MetaDataValidator = ({ location }) => {
  const [validatorResult, setValidatorResult] = useState(null); // YAML
  const [data, setData] = useState({ key: -1 }); // JSON
  const [eml, setEML] = useState(null); // JSON
  const [submissionError, setSubmissionError] = useState(null);
  const [emlError, setEmlError] = useState(null);

  const [downloadUrl, setDownloadUrl] = useState(null);
  const [emlDownloadUrl, setEmlDownloadUrl] = useState(null);
  const [jsonDownloadUrl, setJsonDownloadUrl] = useState(null);

  const [type, setType] = useState("YAML");
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [activeTab, onTabChange] = useState("1");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [template, setTemplate] = useState(null);
  // console.log(location);
  useEffect(() => {
    if (location.search) {
      const params = qs.parse(location.search);
      if (params.template) {
        setTemplate(params.template);
        axios.get(`${config.dataApi}dataset/${params.template}`).then((res) => {
          const d = { ...res.data, key: -1 };
          setData(d);
          setUploadModalVisible(true);
        });
      }
    }
  }, [location]);

  const customRequest = (options) => {
    const reqConfig = {
      headers: {
        "Content-Type": CONTENT_TYPES[type] || CONTENT_TYPES.YAML,
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
  const cleanformData = (input) => {
    return Object.keys(input).reduce((acc, cur) => {
      if (_.isArray(input[cur]) && input[cur].length > 0) {
        acc[cur] = input[cur].filter((d) => {
          return _.isObject(d) ? !_.isEmpty(d) : !!d;
        });
      } else if (_.isObject(input[cur]) && !_.isEmpty(input[cur])) {
        acc[cur] = input[cur];
      } else {
        if (!!input[cur]) {
          acc[cur] = input[cur];
        }
      }
      return acc;
    }, {});
  };

  const validateFromMetadataForm = async (values) => {
    let yamlRes, emlRes, jsonRes;
    try {
      yamlRes = await axios.post(`${config.dataApi}parser/metadata`, values, {
        headers: { "Content-Type": "application/json", Accept: "text/yaml" },
      });
      setValidatorResult(yamlRes.data);
      makeFiles({
        yaml: validatorResult,
      });

      jsonRes = await axios.post(`${config.dataApi}parser/metadata`, values, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      setData({ ...jsonRes.data, key: -1 });
      makeFiles({
        json: JSON.stringify(_.omit(data, "key")),
      });
    } catch (err) {
      setSubmissionError(err);
    }
    try {
      emlRes = await axios.post(`${config.dataApi}parser/metadata`, values, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/xml",
        },
      });
      setEML(emlRes.data);
      makeFiles({
        eml: eml,
      });
    } catch (err) {
      setEmlError(err);
    }
  };

  const makeFiles = async (formats) => {
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (formats.yaml) {
      const yamlBlob = new Blob([formats.yaml], { type: "text/plain" });
      if (downloadUrl !== null) {
        setDownloadUrl(null);
        window.URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(window.URL.createObjectURL(yamlBlob));
    }

    if (formats.eml) {
      const emlBlob = new Blob([formats.eml], { type: "text/plain" });
      if (emlDownloadUrl !== null) {
        setEmlDownloadUrl(null);
        window.URL.revokeObjectURL(emlDownloadUrl);
      }
      setEmlDownloadUrl(window.URL.createObjectURL(emlBlob));
    }
    if (formats) {
      const jsonBlob = new Blob([formats.json], {
        type: "text/plain",
      });
      if (jsonDownloadUrl !== null) {
        setJsonDownloadUrl(null);
        window.URL.revokeObjectURL(jsonDownloadUrl);
      }
      setJsonDownloadUrl(window.URL.createObjectURL(jsonBlob));
    }
  };

  const validateFromUrl = (url, cb) => {
    return axios(`${config.dataApi}parser/metadata?url=${url}&format=${type}`)
      .then((res) => {
        const d = { ...res.data, key: -1 };
        setData(d);
        if (typeof cb === "function") {
          cb(d);
        }
        // setValidatorResult(res.data);
      })
      .catch((err) => setSubmissionError(err));
  };

  const validateFromYaml = (yaml, cb) => {
    return axios
      .post(`${config.dataApi}parser/metadata?format=${type}`, yaml, {
        headers: { "Content-Type": "text/yaml" },
      })
      .then((res) => {
        const d = { ...res.data, key: -1 };
        setData(d);
        if (typeof cb === "function") {
          cb(d);
        }
        // setValidatorResult(res.data);
      })
      .catch((err) => setSubmissionError(err));
  };

  const onFinish = (values, gotoStep = 1) => {
    const cb = gotoStep === 2 ? validateFromMetadataForm : null;
    if (values.url) {
      validateFromUrl(values.url, cb);
    } else if (values.yaml) {
      validateFromYaml(values.yaml, cb);
    }
    setStep(gotoStep);
  };
  const onFinishFailed = (err) => {
    setSubmissionError(err);
  };
  const onTypeChange = (e) => {
    setType(e.target.value);
  };
  const getHighlighted = (text, lang) => {
    try {
      const { Prism } = window;
      const html = Prism.highlight(text, Prism.languages[lang], lang);
      return html;
    } catch (error) {
      return text;
    }
  };
  return (
    <Layout
      selectedKeys={["metadatagenerator"]}
      openKeys={["tools"]}
      title="Metadata Generator"
    >
      <PageContent>
        <Steps
          current={step}
          style={{ marginBottom: "24px" }}
          onChange={setStep}
        >
          <Step title={"Upload or enter Metadata"} />
          <Step title={"Edit Metadata"} />
          <Step title={"Review validation result"} />
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
        <Modal
          title={template ? `Template fetched` : "Upload successful"}
          visible={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={
            <>
              <Button
                onClick={() => {
                  setUploadModalVisible(false);
                  setStep(1);
                }}
              >
                Edit and validate
              </Button>
              <Button
                onClick={() => {
                  validateFromMetadataForm(data);
                  setUploadModalVisible(false);
                  setStep(2);
                }}
              >
                Validate only
              </Button>
            </>
          }
        >
          {template && data && (
            <p>
              Templating metadata from{" "}
              {
                <strong>
                  {data.title} version {data.version}
                </strong>
              }
            </p>
          )}
          <p>Do you want to edit the metadata before validation?</p>
        </Modal>
        {step === 0 && (
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
                customRequest={customRequest}
                onSuccess={(res) => {
                  setData({ ...res, key: -1 });
                  setUploadModalVisible(true);
                  // setStep(1);
                }}
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
                  Edit and validate
                </Button>
                <Button
                  style={{ marginLeft: "8px" }}
                  type="primary"
                  onClick={() => {
                    onFinish(form.getFieldsValue(true), 2);
                  }}
                >
                  Validate only
                </Button>
              </Form.Item>
            </Form>
          </React.Fragment>
        )}
        {step === 1 && (
          <MetaDataForm
            saveButtonLabel="Validate"
            data={data}
            onSaveSuccess={(res) => {
              setData({ ...res, key: -1 });
              validateFromMetadataForm(cleanformData(res));
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={onTabChange}
          >
            <TabPane tab="YAML" key="1">
              <Row style={{ marginBottom: "10px" }}>
                <Col flex="auto"></Col>
                <Col>
                  <Button
                    type="primary"
                    href={downloadUrl}
                    download={"metadata.yaml"}
                    style={{ marginRight: "10px" }}
                  >
                    <DownloadOutlined /> Download
                  </Button>
                </Col>
              </Row>
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: getHighlighted(validatorResult, "yaml"),
                  }}
                ></code>
              </pre>
            </TabPane>
            <TabPane tab="EML" key="2">
              {!emlError && (
                <Row style={{ marginBottom: "10px" }}>
                  <Col flex="auto"></Col>
                  <Col>
                    <Button
                      type="primary"
                      href={emlDownloadUrl}
                      download={"eml.xml"}
                      style={{ marginRight: "10px" }}
                    >
                      <DownloadOutlined /> Download
                    </Button>
                  </Col>
                </Row>
              )}
              {emlError && (
                <Alert
                  type="error"
                  closable
                  onClose={() => setEmlError(null)}
                  message={
                    <ErrorMsg
                      error={emlError}
                      style={{ marginBottom: "10px" }}
                    />
                  }
                ></Alert>
              )}
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: getHighlighted(eml, "xml"),
                  }}
                ></code>
              </pre>
            </TabPane>
            <TabPane tab="JSON" key="3">
              <Row style={{ marginBottom: "10px" }}>
                <Col flex="auto"></Col>
                <Col>
                  <Button
                    type="primary"
                    href={jsonDownloadUrl}
                    download={"metadata.json"}
                    style={{ marginRight: "10px" }}
                  >
                    <DownloadOutlined /> Download
                  </Button>
                </Col>
              </Row>
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: getHighlighted(
                      JSON.stringify(_.omit(data, "key"), null, 2),
                      "json"
                    ),
                  }}
                ></code>
              </pre>
            </TabPane>
          </Tabs>
        )}
      </PageContent>
    </Layout>
  );
};

export default withRouter(MetaDataValidator);
