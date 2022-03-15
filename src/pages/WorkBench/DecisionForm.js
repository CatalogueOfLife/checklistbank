import React, { useState } from "react";

import {
  Input,
  Modal,
  Select,
  Alert,
  Checkbox,
  AutoComplete,
  Row,
  Col,
  Steps,
  notification,
  Form,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const { Step } = Steps;

const Option = Select.Option;
const FormItem = Form.Item;
const { TextArea } = Input;

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

const removeEmptyValues = (myObj) => {
  Object.keys(myObj).forEach((key) => {
    (typeof myObj[key] === "undefined" ||
      myObj[key] === "" ||
      myObj[key] === null) &&
      delete myObj[key];
  });
};

const DecisionForm = (props) => {
  const {
    rank,
    nomstatus,
    nomCode,
    nametype,
    environment,
    taxonomicstatus,
    onCancel,
    onOk,
    rowsForEdit,
    datasetKey,
    subjectDatasetKey,
    onSaveDecision,
    destroyOnClose = false
  } = props;

  const [visible, setVisible] = useState(true);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const currentRow = rowsForEdit[current];
  //const currentDecision = _.get(rowsForEdit[current], 'decisions[0]' );

  const handleSubmit = (next, cb) => {
    setConfirmLoading(true);
    form.validateFields().then((values) => {
     // console.log("Received values of form: ", values);
      const decision = {
        name: {
          scientificName: values.scientificName,
          authorship: values.authorship,
          rank: values.rank,
          status: values.nomstatus,
          code: values.nomCode,
          type: values.nametype,
        },
        environments: values.environments,
        status: values.status,
        fossil: values.fossil,
        recent: values.recent,
        note: values.note,
      };
      removeEmptyValues(decision.name);
      if (_.isEmpty(decision.name, true)) {
        delete decision.name;
      }
      removeEmptyValues(decision);

      if (!_.isEmpty(decision, true)) {
        applyDecision(decision)
          .then(() => {
            setCurrent(next);
            form.resetFields();
            if (cb && typeof cb === "function") {
              cb();
            }
          })
          .catch((err) => {
            //setCurrent(next)
            setError(err);
          });
      } else {
        setCurrent(next);
        form.resetFields();
        if (cb && typeof cb === "function") {
          cb();
        }
      }
    });
  };

  const applyDecision = (decisionObjectFromForm) => {
    const currentRow = rowsForEdit[current];

    const currentDecision = _.get(currentRow, "decisions[0]");

    let decisionObject;

    decisionObject = { ...decisionObjectFromForm };
    decisionObject.mode = "update";
    decisionObject.subjectDatasetKey = Number(subjectDatasetKey);
    decisionObject.datasetKey = Number(datasetKey);
    decisionObject.subject = (currentDecision && !_.get(currentRow, "usage.id") && currentDecision?.subject) ? currentDecision.subject : {
      id: _.get(currentRow, "usage.id"),

      name: _.get(currentRow, "usage.name.scientificName"),
      authorship: _.get(currentRow, "usage.name.authorship"),
      rank: _.get(currentRow, "usage.name.rank"),
      status: _.get(currentRow, "usage.status"),
      parent:
        currentRow.classification && currentRow.classification.length > 1
          ? currentRow.classification[currentRow.classification.length - 2].name
          : currentRow?.parent ? currentRow.parent : "",
      code: _.get(currentRow, "usage.name.code"),
    };

    const method = currentDecision ? "put" : "post";
    return axios[method](
      `${config.dataApi}dataset/${datasetKey}/decision${
        currentDecision ? "/" + currentDecision.id : ""
      }`,
      decisionObject
    )
      .then((res) => {
        if (method === "post") {
          currentRow.decisions = [{ id: res.data }];
        }
        return currentRow;
      })
      .then((row) => onSaveDecision(row))
      .then((res) => {
        setError(null);
        setConfirmLoading(false);
        notification.open({
          message: `Decision ${currentDecision ? "updated" : "applied"}`,
        });
      })
      .catch((err) => {
        form.resetFields();
        setConfirmLoading(false);
        setError(err);
      });
  };

  const getInitialValues = () => {
    const currentDecision = _.get(rowsForEdit[current], "decisions[0]");
    return {
      scientificName: _.get(currentDecision, "name.scientificName")
        ? _.get(currentDecision, "name.scientificName")
        : "",
      authorship: _.get(currentDecision, "name.authorship")
        ? _.get(currentDecision, "name.authorship")
        : "",
      rank: _.get(currentDecision, "name.rank")
        ? _.get(currentDecision, "name.rank")
        : "",
      status: _.get(currentDecision, "status")
        ? _.get(currentDecision, "status")
        : "",
      nametype: _.get(currentDecision, "name.type")
        ? _.get(currentDecision, "name.type")
        : "",
      nomstatus: _.get(currentDecision, "name.nomstatus")
        ? _.get(currentDecision, "name.nomstatus")
        : "",
      nomCode: _.get(currentDecision, "name.nomCode")
        ? _.get(currentDecision, "name.nomCode")
        : "",
      environments: _.get(currentDecision, "environments")
        ? _.get(currentDecision, "environments")
        : [],
      extinct: _.get(currentDecision, "extinct") === true ? true : false,
      note: _.get(currentDecision, "note")
        ? _.get(currentDecision, "note")
        : "",
    };
  };

  return (
    <Modal
      width="90%"
      title={<span>Decision</span>}
      visible={visible}
      destroyOnClose={destroyOnClose}
      onOk={() => {
        handleSubmit(current, onOk);
      }}
      confirmLoading={confirmLoading}
      onCancel={() => {
        setVisible(false);
        if (onCancel && typeof onCancel === "function") {
          onCancel();
        }
      }}
      destroyOnClose={true}
    >
      <Row>
        {error && (
          <Alert
            style={{ marginBottom: "10px" }}
            description={<ErrorMsg error={error} />}
            closable
            type="error"
          />
        )}
      </Row>
      <Row>
        <Col span={16}>
          <Form form={form} initialValues={getInitialValues()}>
            <FormItem
              {...formItemLayout}
              label="Scientific name"
              name="scientificName"
            >
              <AutoComplete
                dataSource={
                  _.get(currentRow, `usage.name.scientificName`)
                    ? [_.get(currentRow, `usage.name.scientificName`)]
                    : []
                }
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Authorship" name="authorship">
              <AutoComplete
                dataSource={
                  _.get(currentRow, `usage.name.authorship`)
                    ? [_.get(currentRow, `usage.name.authorship`)]
                    : []
                }
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Rank" name="rank">
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                  -
                </Option>
                {rank.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Taxonomic status"
              name="status"
            >
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                  -
                </Option>
                {taxonomicstatus.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem {...formItemLayout} label="Name type" name="nametype">
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                  -
                </Option>
                {nametype.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem {...formItemLayout} label="Nom. status" name="nomstatus">
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                  -
                </Option>
                {nomstatus.map((r) => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem {...formItemLayout} label="Nom. code" name="nomCode">
              <Select style={{ width: 200 }} showSearch>
                <Option key="_null" value={""}>
                  -
                </Option>
                {nomCode.map((r) => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="environments"
              name="environments"
            >
              <Select style={{ width: 200 }} showSearch mode="multiple">
                {environment.map((r) => (
                  <Option key={r.name} value={r.name}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Extinct"
              valuePropName="checked"
              name="extinct"
            >
              <Checkbox />
            </FormItem>

            <FormItem {...formItemLayout} label="Note" name="note">
              <TextArea />
            </FormItem>
          </Form>
        </Col>
        <Col span={7} style={{ marginLeft: "20px" }}>
          {rowsForEdit && rowsForEdit.length > 1 && (
            <Steps
              direction="vertical"
              size="small"
              onChange={handleSubmit}
              current={current}
            >
              {rowsForEdit.map((r, index) => (
                <Step
                  title={_.get(r, "usage.name.scientificName")}
                  icon={
                    index === current && confirmLoading ? (
                      <LoadingOutlined />
                    ) : null
                  }
                />
              ))}
            </Steps>
          )}
        </Col>
      </Row>
    </Modal>
  );
};

const mapContextToProps = ({
  rank,
  nomstatus,
  nomCode,
  nametype,
  environment,
  taxonomicstatus,
}) => ({
  rank,
  nomstatus,
  nomCode,
  nametype,
  environment,
  taxonomicstatus,
});

export default withContext(mapContextToProps)(DecisionForm);
