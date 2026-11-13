import React, { useState, useEffect } from "react";
import {
  Input,
  InputNumber,
  Select,
  Button,
  Alert,
  App,
  Form,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../config";
import ErrorMsg from "../components/ErrorMsg";
import CsvDelimiterInput from "./CsvDelimiterInput";
import withContext from "./hoc/withContext";
import TagControl from "./TagControl";
const FormItem = Form.Item;

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
    environment,
    filter,
    order,
  } = props;

  const { notification } = App.useApp();
  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();
  useEffect(() => {}, [datasetoriginEnum]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = (values) => {
    if (values["csv delimiter"] === "\\t") {
      values["csv delimiter"] = `\t`;
    }
    // the API replaces all settings, so keep the ones this form does not show
    axios
      .put(`${config.dataApi}dataset/${datasetKey}/settings`, { ...data, ...values })
      .then((res) => {
        if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        }
        notification.open({ title: "Settings updated" });
        setSubmissionError(null);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  const initialValues = data;
  const SIMPLE_TYPES = ["String", "Integer", "URI", "UUID", "Character"];
  // the settings for the origin of this dataset, optionally limited by the filter prop
  const settings = datasetSettings.filter(
    (s) =>
      _.get(s, "origin", ["project", "external"]).indexOf(dataset?.origin) > -1 &&
      (!filter || filter(s))
  );
  // in the given order of names, or booleans first, then the csv delimiter, simple values and enumerations
  const ordered = order
    ? _.sortBy(settings, (s) => order.indexOf(s.name))
    : _.sortBy(settings, (s) =>
        s.type === "Boolean" ? 0 : s.name === "csv delimiter" ? 1 : SIMPLE_TYPES.includes(s.type) ? 2 : 3
      );

  const renderInput = (s) => {
    if (s.type === "Boolean") {
      return <Input type="checkbox" />;
    }
    if (s.name === "csv delimiter") {
      return <CsvDelimiterInput />;
    }
    if (SIMPLE_TYPES.includes(s.type)) {
      return s.type === "Integer" ? (
        s.multiple ? <TagControl type="number" /> : <InputNumber />
      ) : s.multiple ? (
        <TagControl type="text" />
      ) : (
        <Input type="text" />
      );
    }
    if (s.type === "NomCode") {
      return (
        <Select
          style={{ width: 200 }}
          showSearch
          allowClear
          options={nomCode.map((c) => ({
            value: c.name,
            label: `${c.name} (${c.acronym})`,
          }))}
        />
      );
    }
    const values = props[_.camelCase(s.type)];
    if (!values) {
      console.log(`Error: Missing enum injection ${_.camelCase(s.type)}`);
      return null;
    }
    return (
      <Select
        style={{ width: 200 }}
        mode={s.multiple ? "multiple" : null}
        showSearch
        allowClear
        options={values.map((e) =>
          typeof e === "string" ? { value: e, label: e } : { value: e.name, label: e.name }
        )}
      />
    );
  };

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
            closable={{ onClose: () => setSubmissionError(null) }}
            description={<ErrorMsg error={submissionError}></ErrorMsg>}
            type="error"
          />
        </FormItem>
      )}

      {ordered.map((s) => {
        const input = renderInput(s);
        return (
          input && (
            <FormItem
              {...formItemLayout}
              label={_.startCase(s.name)}
              tooltip={s.description}
              key={s.name}
              name={s.name}
              valuePropName={s.type === "Boolean" ? "checked" : "value"}
            >
              {input}
            </FormItem>
          )
        );
      })}

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
  datasetType,
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
  nomstatus: nomStatus,
  environment,
}) => ({
  addError,
  addInfo,
  frequency,
  datasetType,
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
  nomStatus,
  environment,
});

export default withContext(mapContextToProps)(SettingsForm);
