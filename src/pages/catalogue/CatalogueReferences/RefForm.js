import React, { useState } from "react";

import {
  Input,
  InputNumber,
  Select,
  Button,
  Alert,
  Row,
  Col,
  notification,
  Form,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import TagControl from "../../../components/TagControl";

const types = {
  book: {
    typeLabel: "Book",
  },
  incollection: {
    typeLabel: "Chapter",
    "container-title": "Book title",
    title: "Chapter title",
  },
  "paper-conference": {
    typeLabel: "Conference paper",
  },
  "article-journal": {
    typeLabel: "Journal article",
    "container-title": "Journal",
  },
  "article-magazine": {
    typeLabel: "Magazine article",
    "container-title": "Magazine",
  },
  "article-newspaper": {
    typeLabel: "Newspaper article",
    "container-title": "Newspaper",
  },
  webpage: {
    typeLabel: "Webpage",
    "container-title": "Website",
  },
  personal_communication: {
    typeLabel: "Personal communication",
  },
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

const getPages = (values) => {
  if (
    !isNaN(values.pagesFrom) &&
    values.pagesFrom > 0 &&
    !isNaN(values.pagesTo) &&
    values.pagesTo > 0
  ) {
    return `${values.pagesFrom}-${values.pagesTo}`;
  }
};

const getCslPersons = (values) => {
  if (_.isArray(values) && _.get(values, "[0]")) {
    return values.map((a) => {
      const splitted = a.split(" ");
      if (splitted.length > 1) {
        return {
          family: splitted[splitted.length - 1],
          given: splitted.slice(0, -1).join(" "),
        };
      } else if (splitted.length === 1) {
        return {
          family: a,
        };
      }
    });
  }
};

const getCslDate = (value) => {
  return value
    ? {
        "date-parts": value.split("-"),
      }
    : "";
};

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description,
  });
};

const RefForm = (props) => {
  const [submissionError, setSubmissionError] = useState(null);
  const [type, setType] = useState(null);
  const [form] = Form.useForm();
  const { data, datasetKey, onSaveSuccess } = props;

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const handleSubmit = (values) => {
    // console.log('Received values of form: ', values);

    let csl = {
      ..._.omit(values, ["pagesFrom", "pagesTo"]),
      pages: getPages(values),
      author: getCslPersons(values.author),
      editor: getCslPersons(values.editor),
      issued: getCslDate(values.issued),
      accessed: getCslDate(values.accessed),
    };

    console.log(JSON.stringify(csl, null, 2));
    submitData(csl);
  };

  const submitData = (values) => {
    const id = _.get(props, "data.id");
    const conf = {
      headers: {
        "Content-Type": "application/vnd.citationstyles.csl+json",
      },
    };
    const task = id
      ? axios.put(
          `${config.dataApi}dataset/${datasetKey}/reference/${id}`,
          values,
          conf
        )
      : axios.post(
          `${config.dataApi}dataset/${datasetKey}/reference`,
          values,
          conf
        );

    task
      .then((res) => {
        let title = id ? "Reference updated" : "Reference saved";
        let msg = id
          ? `Data successfully updated for ${values.title}`
          : `${values.title} saved with id ${res.id}`;
        setSubmissionError(null);
        if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        }
        openNotification(title, msg);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };
  const initialData = data || {};
  const initialValues = {
    author: [],
    editor: [],
    issue: 1,
    edition: 1,
    volume: 1,
    ...initialData,
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      onFinishFailed={onFinishFailed}
      initialValues={initialValues}
      style={{ paddingTop: "12px" }}
    >
      {submissionError && (
        <FormItem>
          <Alert
            message={<ErrorMsg error={submissionError}></ErrorMsg>}
            type="error"
          />
        </FormItem>
      )}

      <FormItem
        {...formItemLayout}
        label="Type"
        name="type"
        rules={[
          {
            required: true,
            message: "Please select the reference type",
          },
        ]}
      >
        <Select
          style={{ width: 200 }}
          onChange={(value) => setType(value)}
          showSearch
        >
          {Object.keys(types).map((f) => {
            return (
              <Option key={f} value={f}>
                {types[f].typeLabel}
              </Option>
            );
          })}
        </Select>
      </FormItem>
      <FormItem
        {...formItemLayout}
        label={_.get(types, `[${type}].title`) || "Title"}
        name="title"
        rules={[
          {
            required: true,
            message: "Please input title",
          },
        ]}
      >
        <Input />
      </FormItem>

      {[
        "incollection",
        "article-journal",
        "article-magazine",
        "article-newspaper",
      ].indexOf(type) > -1 && (
        <FormItem
          {...formItemLayout}
          label={_.get(types, `[${type}].container-title`) || "Container title"}
          name="container-title"
          rules={[
            {
              required: true,
              message: "Please input container title",
            },
          ]}
        >
          <Input />
        </FormItem>
      )}

      <FormItem {...formItemLayout} label="Author(s)" name="author">
        <TagControl label="Add author" removeAll={true} />
      </FormItem>

      {[
        "book",
        "incollection",
        "paper-conference",
        "article-journal",
        "article-magazine",
        "article-newspaper",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Editor(s)" name="editor">
          <TagControl label="Add editor" removeAll={true} />
        </FormItem>
      )}

      {["paper-conference", "article-journal"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Issue" name="issue">
          <InputNumber min="1" />
        </FormItem>
      )}

      {["book", "incollection", "article-magazine"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Edition" name="edition">
          <InputNumber min="1" />
        </FormItem>
      )}

      {[
        "book",
        "incollection",
        "paper-conference",
        "article-journal",
        "article-magazine",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Volume" name="volume">
          <InputNumber min="1" />
        </FormItem>
      )}

      {[
        "incollection",
        "article-journal",
        "article-magazine",
        "article-newspaper",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Pages">
          {" "}
          <Row>
            <Col span={6}>
              <FormItem name="pagesFrom">
                <InputNumber style={{ width: "90%" }} />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem name="pagesTo">
                <InputNumber style={{ width: "90%" }} />
              </FormItem>
            </Col>
          </Row>
        </FormItem>
      )}

      {["paper-conference"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Event (Conference)" name="event">
          <Input type="text" />
        </FormItem>
      )}
      {["book", "incollection", "paper-conference"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Publisher" name="publisher">
          <Input type="text" />
        </FormItem>
      )}

      {["book", "incollection", "article-newspaper"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Place" name="publisher-place">
          <Input type="text" />
        </FormItem>
      )}

      {[
        "book",
        "incollection",
        "paper-conference",
        "article-journal",
        "article-magazine",
        "article-newspaper",
        "webpage",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="URL" name="URL">
          <Input type="url" />
        </FormItem>
      )}
      {["paper-conference", "article-journal"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="DOI" name="DOI">
          <Input type="text" />
        </FormItem>
      )}

      {["book", "incollection", "paper-conference"].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="ISBN" name="ISBN">
          <Input type="text" />
        </FormItem>
      )}

      {["article-journal", "article-magazine", "article-newspaper"].indexOf(
        type
      ) > -1 && (
        <FormItem {...formItemLayout} label="ISSN" name="ISSN">
          <Input type="text" />
        </FormItem>
      )}

      {[
        "book",
        "incollection",
        "paper-conference",
        "article-journal",
        "article-magazine",
        "article-newspaper",
        "webpage",
        "personal_communication",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Issued" name="issued">
          <Input type="date" />
        </FormItem>
      )}

      {[
        "book",
        "incollection",
        "paper-conference",
        "article-journal",
        "article-magazine",
        "article-newspaper",
        "webpage",
        "personal_communication",
      ].indexOf(type) > -1 && (
        <FormItem {...formItemLayout} label="Accessed" name="accessed">
          <Input type="date" />
        </FormItem>
      )}

      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </FormItem>
    </Form>
  );
};

export default RefForm;
