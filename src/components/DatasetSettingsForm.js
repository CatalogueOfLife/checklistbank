import React, { useState, useEffect } from "react";
import {
  Input,
  InputNumber,
  Select,
  Button,
  Alert,
  notification,
  Form,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../config";
import ErrorMsg from "../components/ErrorMsg";
import CsvDelimiterInput from "./CsvDelimiterInput";
import withContext from "./hoc/withContext";
import TagControl from "./TagControl"
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
    xs: { span: 18 },
    sm: { span: 6 },
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
      offset: 6,
    },
  },
};

const SettingsForm = (props) => {
  const {
    data,
    nomCode,
    datasetSettings,
    datasetoriginEnum,
    onSaveSuccess,
    datasetKey,
    dataset,
  } = props;

  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();
  useEffect(() => { }, [datasetoriginEnum]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = (values) => {
    if (values["csv delimiter"] === "\\t") {
      values["csv delimiter"] = `\t`;
    }
    axios
      .put(`${config.dataApi}dataset/${datasetKey}/settings`, values)
      .then((res) => {
        if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        }
        openNotification("Settings updated");
        setSubmissionError(null);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const initialValues = data;

  return (
    <Form
      initialValues={initialValues}
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
      style={{ paddingTop: "12px" }}
    >
      {submissionError && (
        <FormItem>
          <Alert
            closable
            onClose={() => setSubmissionError(null)}
            description={<ErrorMsg error={submissionError}></ErrorMsg>}
            type="error"
          />
        </FormItem>
      )}

      {datasetSettings
        .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset?.origin) > -1)
        .filter((s) => s.type === "Boolean")
        .map((s) => (
          <FormItem
            {...formItemLayout}
            label={_.startCase(s.name)}
            key={s.name}
            name={s.name}
            valuePropName="checked"
          >
            <Input type="checkbox" />
          </FormItem>
        ))}
      <FormItem
        {...formItemLayout}
        label={_.startCase("csv delimiter")}
        key={"csv delimiter"}
        name={"csv delimiter"}
      >
        <CsvDelimiterInput />
      </FormItem>
      {datasetSettings
        .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset?.origin) > -1)
        .filter(
          (s) => ["String", "Integer", "URI", "UUID", "Character"].includes(s.type)
            /* (s.type === "String" || s.type === "Integer" || s.type === "URI") */ &&
            s.name !== "csv delimiter"
        )
        .map((s) => (
          <FormItem
            {...formItemLayout}
            label={_.startCase(s.name)}
            key={s.name}
            name={s.name}
          >
            {s.type === "String" || s.type === "URI" || s.type === "UUID" || s.type === "Character" ? (
              s.multiple ? <TagControl /> : <Input type="text" />
            ) : (
              <InputNumber />
            )}
          </FormItem>
        ))}

      {datasetSettings
        .filter((s) => _.get(s, 'origin', ['project', 'external']).indexOf(dataset?.origin) > -1)
        .filter(
          (s) => !["String", "Integer", "Boolean", "URI", "UUID", "Character"].includes(s.type)
        )
        .map((s) => (
          <FormItem
            {...formItemLayout}
            label={_.startCase(s.name)}
            key={s.name}
            name={s.name}
          >
            {s.type === "NomCode" ? (
              <Select style={{ width: 200 }} showSearch allowClear>
                {nomCode.map((c) => {
                  return (
                    <Option
                      key={c.name}
                      value={c.name}
                    >{`${c.name} (${c.acronym})`}</Option>
                  );
                })}
              </Select>
            ) : (
              <Select
                style={{ width: 200 }}
                mode={s.multiple ? "multiple" : null}
                showSearch
                allowClear
              >
                {props[_.camelCase(s.type)].map((e) => {
                  return typeof e === "string" ? (
                    <Option key={e} value={e}>
                      {e}
                    </Option>
                  ) : (
                    <Option key={e.name} value={e.name}>
                      {e.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
        ))}

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
  entitytype: entityType,
  rank,
  datasetSettings,
  gazetteer,
  doiResolution,
  nametype: nameType,
  nomStatus
}) => ({
  addError,
  addInfo,
  frequency,
  datasettypeEnum,
  dataFormat,
  datasetoriginEnum,
  licenseEnum,
  nomCode,
  entityType,
  rank,
  datasetSettings,
  gazetteer,
  doiResolution,
  nameType,
  nomStatus
});

export default withContext(mapContextToProps)(SettingsForm);
