import React, { useState, useEffect } from "react";

import {
  Input,
  Modal,
  Select,
  Alert,
  Steps,
  Button,
  notification,
  Form,
} from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";

const Option = Select.Option;
const FormItem = Form.Item;
const Step = Steps.Step;

const removeEmptyValues = (myObj) => {
  Object.keys(myObj).forEach((key) => {
    (typeof myObj[key] === "undefined" ||
      myObj[key] === "" ||
      myObj[key] === null) &&
      delete myObj[key];
  });
};
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 17 },
  },
};

const steps = [
  {
    title: "Enter name",
    okText: "Parse name",
    cancelText: "Cancel",
  },
  {
    title: "Review parsed",
    okText: "Submit",
    cancelText: "Previous",
  },
  {
    title: "Submit",
    okText: "Submit",
    cancelText: "Previous",
  },
];

const EditTaxonModal = (props) => {
  const { rank, nomstatus, nametype, onCancel } = props;

  const [visible, setVisible] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [taxon, setTaxon] = useState(null);
  const [current, setCurrent] = useState(0);
  const [selectedRank, setSelectedRank] = useState(null);
  const [suggestedNameValue, setSuggestedNameValue] = useState(null);
  const [parsedName, setParsedName] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (props.taxon) {
      getTaxon();
    }
  }, [props.taxon]);

  const getTaxon = () => {
    const { taxon } = props;
    axios(
      `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${encodeURIComponent(
        taxon.id
      )}`
    ).then((tx) => {
      setTaxon(tx.data);
      setSuggestedNameValue(
        `${_.get(tx, "data.name.scientificName")}${
          _.get(tx, "data.name.authorship")
            ? " " + _.get(tx, "data.name.authorship")
            : ""
        }`
      );
    });
  };

  const isAboveSpeciesAggregate = (rank) => {
    return props.rank.indexOf(rank) < props.rank.indexOf("species aggregate");
  };
  const isInfraSpecific = (rank) => {
    return props.rank.indexOf(rank) > props.rank.indexOf("species");
  };

  const parseName = () => {
    axios(`${config.dataApi}parser/name?name=${suggestedNameValue}`).then(
      (res) => {
        if (_.get(res, "data[0]")) {
          form.setFieldsValue(_.get(res, "data[0].name"));
          setParsedName(_.get(res, "data[0].name"));
          setSelectedRank(_.get(res, "data[0].name.rank"));
        }
      }
    );
  };

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = (values) => {
    removeEmptyValues(values);
    //  const updatedName = { ...name, ...values };
    submitData({ ...values, origin: "user" });
  };

  const submitData = (updatedName) => {
    const { name } = taxon;

    axios
      .put(
        `${config.dataApi}dataset/${name.datasetKey}/name/${name.id}`,
        updatedName
      )
      .then((res) => {
        setSubmissionError(null);
        setConfirmLoading(false);
        notification.open({
          message: "Name updated",
          description: `${updatedName.scientificName} was updated`,
        });
        if (props.onSuccess && typeof props.onSuccess === "function") {
          props.onSuccess();
        }
      })
      .catch((err) => {
        setCurrent(1);
        setSubmissionError(err);
        setConfirmLoading(false);
      });
  };
  return (
    <Modal
      style={{ width: "650px" }}
      title={
        <span>
          Edit{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(taxon, "name.scientificName"),
            }}
          />
        </span>
      }
      visible={visible}
      okText={steps[current].okText}
      onOk={() => {
        setConfirmLoading(true);
        form.validateFields().then((values) => {
          handleSubmit(values);
          next();
        });
      }}
      confirmLoading={confirmLoading}
      cancelText={steps[current].cancelText}
      onCancel={onCancel}
      destroyOnClose={true}
      footer={
        current === 0
          ? [
              <Button key="back" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={() => {
                  parseName();
                  next();
                }}
              >
                Parse name
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button key="back" onClick={prev}>
                Previous
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={confirmLoading}
                onClick={() => {
                  setConfirmLoading(true);
                  form.validateFields().then((values) => {
                    handleSubmit(values);
                    next();
                  });
                }}
              >
                Submit
              </Button>,
            ]
      }
    >
      <Steps current={current} style={{ marginBottom: "10px" }}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      {current === 0 && (
        <Input
          value={suggestedNameValue}
          onChange={(e) => setSuggestedNameValue(e.target.value)}
          allowClear
        />
      )}
      {current === 1 && (
        <Form form={form} initialValues={parsedName}>
          <FormItem
            {...formItemLayout}
            label="Scientific name"
            name="scientificName"
            rules={[
              {
                required: true,
                message: "Please input Full Taxon name",
              },
            ]}
          >
            <Input />
          </FormItem>
          {isAboveSpeciesAggregate(selectedRank) && (
            <FormItem {...formItemLayout} label="Uninomial" name="uninomial">
              <Input />
            </FormItem>
          )}
          {!isAboveSpeciesAggregate(selectedRank) && (
            <FormItem {...formItemLayout} label="Genus" name="genus">
              <Input />
            </FormItem>
          )}
          {!isAboveSpeciesAggregate(selectedRank) && (
            <FormItem
              {...formItemLayout}
              label="Specific Epithet"
              name="specificEpithet"
            >
              <Input />
            </FormItem>
          )}
          {isInfraSpecific(selectedRank) && (
            <FormItem
              {...formItemLayout}
              label="Infrasp. Epithet"
              name="infraspecificEpithet"
            >
              <Input />
            </FormItem>
          )}
          <FormItem {...formItemLayout} label="Authorship" name="authorship">
            <Input />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="Rank"
            name="rank"
            rules={[
              {
                required: true,
                message: "Please select Taxon rank",
              },
            ]}
          >
            <Select
              style={{ width: 200 }}
              onChange={(value) => {
                setSelectedRank(value);
                form.setFieldsValue({ rank: value });
              }}
              showSearch
            >
              {rank.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem {...formItemLayout} label="Nom. status" name="nomstatus">
            <Select style={{ width: 200 }} showSearch>
              {nomstatus.map((r) => (
                <Option key={r.name} value={r.name}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem {...formItemLayout} label="Name type" name="type">
            <Select style={{ width: 200 }} showSearch>
              {nametype.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      )}
      {submissionError && (
        <Alert
          closable
          onClose={() => setSubmissionError(null)}
          message={<ErrorMsg error={submissionError} />}
          type="error"
        />
      )}
    </Modal>
  );
};

const mapContextToProps = ({ rank, nomstatus, nametype }) => ({
  rank,
  nomstatus,
  nametype,
});

export default withContext(mapContextToProps)(EditTaxonModal);
