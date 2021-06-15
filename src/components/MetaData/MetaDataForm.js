import React, { useState, useEffect } from "react";
import { Input, Select, Button, Alert, Rate, notification, Form } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import TextArea from "antd/lib/input/TextArea";
import ErrorMsg from "../ErrorMsg";
import AgentControl from "./AgentControl";
import CitationControl from "./CitationControl";
import KeyValueControl from "./KeyValueControl";

import PatchFormOriginalDataHelp from "./PatchFormOriginalDataHelp";
import withContext from "../hoc/withContext";

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description,
  });
};

const formItemLayout = {
  labelCol: {
    xs: { span: 20 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 4,
    },
  },
};

const MetaDataForm = (props) => {
  const {
    data,
    datasettypeEnum,
    licenseEnum,
    catalogueKey,
    datasetoriginEnum,
    onSaveSuccess,
    originalData,
  } = props;

  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();
  useEffect(() => {
    console.log(datasetoriginEnum);
  }, [datasetoriginEnum]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = (values) => {
    const key = _.get(data, "key");

    let task = key
      ? axios.put(`${config.dataApi}dataset/${key}`, {
          ...values,
          private: data.private,
        })
      : axios.post(`${config.dataApi}dataset`, values);

    task
      .then((res) => {
        let title = key ? "Meta data updated" : "Dataset registered";
        let msg = key
          ? `Meta data updated successfully updated for ${values.title}`
          : `${values.title} registered and ready for import`;
        if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        }
        openNotification(title, msg);
        setSubmissionError(null);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const submitPatch = (values) => {
    const key = _.get(originalData, "key");

    const sanitised = Object.keys(values).reduce(
      (acc, cur) => {
        if (!_.isUndefined(values[cur])) {
          acc[cur] = values[cur];
        }
        return acc;
      },
      { key }
    );

    const task = _.get(data, "key") // there was already a patch
      ? axios.put(
          `${config.dataApi}dataset/${catalogueKey}/patch/${key}`,
          sanitised
        )
      : axios.post(`${config.dataApi}dataset/${catalogueKey}/patch`, sanitised);

    task
      .then((res) => {
        let title = "Meta data patch";
        let msg = `Successfully patched meta data for ${originalData.title}`;

        if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        }
        openNotification(title, msg);
        setSubmissionError(null);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const initialValues = originalData
    ? data
    : {
        organisations: [],
        authorsAndEditors: [],
        private: false,
        confidence: null,
        completeness: 0,
        ...data,
      };

  const transferOriginalValueToPatch = (value, field) => {
    form.setFieldsValue({ [field]: value });
  };

  return (
    <Form
      initialValues={initialValues}
      onFinish={originalData ? submitPatch : submitData}
      onFinishFailed={onFinishFailed}
      style={{ paddingTop: "12px" }}
      form={form}
    >
      {submissionError && (
        <FormItem>
          <Alert
            closable
            onClose={() => setSubmissionError(null)}
            message={<ErrorMsg error={submissionError}></ErrorMsg>}
            type="error"
          />
        </FormItem>
      )}
      <FormItem
        {...formItemLayout}
        label="Title"
        name="title"
        help={
          originalData ? (
            <PatchFormOriginalDataHelp
              data={originalData}
              field="title"
              transferFn={transferOriginalValueToPatch}
            />
          ) : null
        }
        rules={
          originalData
            ? null
            : [
                {
                  required: true,
                  message: "Please input dataset title",
                },
              ]
        }
      >
        <Input />
      </FormItem>
      {data && (
        <FormItem
          {...formItemLayout}
          label="Alias"
          name="alias"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="alias"
                transferFn={transferOriginalValueToPatch}
              />
            ) : (
              "Abbreviated or shortened memorable name of the dataset intended for easy use in day-to-day communications, as supplied by the custodian"
            )
          }
        >
          <Input />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Issued"
          name="issued"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="issued"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Version"
          name="version"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="version"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="DOI"
          name="doi"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="doi"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Description"
          name="description"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="description"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <TextArea rows={6} />
        </FormItem>
      )}

      {data && (
        <FormItem
          {...formItemLayout}
          label="Contact"
          name="contact"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="contact"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <AgentControl
            agentType="contact"
            label="New contact"
            removeAll={true}
            array={false}
          />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Publisher"
          name="publisher"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="publisher"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <AgentControl
            agentType="publisher"
            label="New publisher"
            removeAll={true}
            array={false}
          />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Creator"
          name="creator"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="creator"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <AgentControl
            agentType="creator"
            label="New creator"
            removeAll={true}
          />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Editor"
          name="editor"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="editor"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <AgentControl
            agentType="editor"
            label="New editor"
            removeAll={true}
          />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Contributor"
          name="contributor"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="contributor"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <AgentControl
            agentType="contributor"
            label="New contributor"
            removeAll={true}
          />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Taxonomic scope"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="taxonomicScope"
                transferFn={transferOriginalValueToPatch}
              />
            ) : (
              "English name of the taxon covered by the dataset"
            )
          }
          name="taxonomicScope"
        >
          <Input />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Geographic scope"
          name="geographicScope"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="geographicScope"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Temporal scope"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="temporalScope"
                transferFn={transferOriginalValueToPatch}
              />
            ) : (
              "Temporal scope of the dataset"
            )
          }
          name="temporalScope"
        >
          <Input />
        </FormItem>
      )}

      {!data && (
        <FormItem
          {...formItemLayout}
          label="Dataset Origin"
          name="origin"
          rules={[
            {
              required: true,
              message: "Please select the dataset origin",
            },
          ]}
          help="This cannot be changed later"
        >
          <Select style={{ width: 200 }} showSearch>
            {datasetoriginEnum
              .filter((f) => f !== "released")
              .map((f) => {
                return (
                  <Option key={f} value={f}>
                    {f}
                  </Option>
                );
              })}
          </Select>
        </FormItem>
      )}
      {!originalData && (
        <FormItem
          {...formItemLayout}
          label="Dataset Type"
          name="type"
          rules={[
            {
              required: true,
              message: "Please select a dataset type",
            },
          ]}
        >
          <Select style={{ width: 200 }} showSearch>
            {datasettypeEnum.map((f) => {
              return (
                <Option key={f} value={f}>
                  {f}
                </Option>
              );
            })}
          </Select>
        </FormItem>
      )}
      <FormItem
        {...formItemLayout}
        label="License"
        name="license"
        rules={
          originalData
            ? null
            : [
                {
                  required: true,
                  message: "Please select a license",
                },
              ]
        }
        help={
          originalData ? (
            <PatchFormOriginalDataHelp
              data={originalData}
              field="license"
              transferFn={transferOriginalValueToPatch}
            />
          ) : null
        }
      >
        <Select style={{ width: 200 }} showSearch>
          <Option value={undefined}>-</Option>
          {licenseEnum.map((f) => {
            return (
              <Option key={f} value={f}>
                {f}
              </Option>
            );
          })}
        </Select>
      </FormItem>
      {data && (
        <FormItem
          {...formItemLayout}
          label="Checklist Confidence"
          name="confidence"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="confidence"
                transferFn={transferOriginalValueToPatch}
              />
            ) : (
              <span>
                Quality of taxonomic checklist with values 1 to 5; quality is
                stated by the custodian in agreement with COL editor. Confidence
                indicators are described at{" "}
                <a
                  href="http://www.catalogueoflife.org/col/info/databases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://www.catalogueoflife.org/col/info/databases
                </a>
              </span>
            )
          }
        >
          <Rate />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Completeness"
          name="completeness"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="completeness"
                transferFn={transferOriginalValueToPatch}
              />
            ) : (
              "Percentage of completeness of species list of the taxon provided by the dataset"
            )
          }
        >
          <Input type="number" min="0" max="100" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Url (website)"
          name="url"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="url"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="url" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Logo Url"
          name="logo"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="logo"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="url" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="ISSN"
          name="issn"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="issn"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="GBIF key"
          name="gbifKey"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="gbifKey"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem
          {...formItemLayout}
          label="Identifiers"
          name="identifier"
          help={
            originalData ? (
              <PatchFormOriginalDataHelp
                data={originalData}
                field="identifier"
                transferFn={transferOriginalValueToPatch}
              />
            ) : null
          }
        >
          <KeyValueControl label="identifier" />
        </FormItem>
      )}

      {/* Only to be shown on existing datasets */}
      {data && (
        <React.Fragment>
          <FormItem
            {...formItemLayout}
            label="Source"
            name="source"
            help={
              originalData ? (
                <PatchFormOriginalDataHelp
                  data={originalData}
                  field="source"
                  transferFn={transferOriginalValueToPatch}
                />
              ) : null
            }
          >
            <CitationControl label="Add citation" data={data.source} />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="Notes"
            name="notes"
            help={
              originalData ? (
                <PatchFormOriginalDataHelp
                  data={originalData}
                  field="notes"
                  transferFn={transferOriginalValueToPatch}
                />
              ) : null
            }
          >
            <TextArea rows={3} />
          </FormItem>
        </React.Fragment>
      )}
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </FormItem>
    </Form>
  );
};

const mapContextToProps = ({
  addError,
  addInfo,
  frequency,
  datasetType: datasettypeEnum,
  dataFormat,
  datasetOrigin: datasetoriginEnum,
  license: licenseEnum,
  nomCode,
  datasetSettings,
  gazetteer,
}) => ({
  addError,
  addInfo,
  frequency,
  datasettypeEnum,
  dataFormat,
  datasetoriginEnum,
  licenseEnum,
  nomCode,
  datasetSettings,
  gazetteer,
});

export default withContext(mapContextToProps)(MetaDataForm);
