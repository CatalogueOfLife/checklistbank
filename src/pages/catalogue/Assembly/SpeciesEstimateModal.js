import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";

import {
  Input,
  Modal,
  Button,
  Select,
  Alert,
  List,
  notification,
  Form,
} from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import EditableTable from "./EditableTable";
import ReferenceAutocomplete from "./ReferenceAutocomplete";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";

const FormItem = Form.Item;
const Option = Select.Option;

const SpeciesestimateModal = (props) => {
  const [visible, setVisible] = useState(true);
  const [addNewMode, setAddNewMode] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (_.isArray(props.taxon.estimates)) {
      setEstimates(props.taxon.estimates);
    }
  }, [props.taxon.estimates]);

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    const { taxon, catalogueKey } = props;
    const newEst = {
      datasetKey: catalogueKey,
      referenceId: _.get(selectedReference, "key") ? selectedReference.key : "",
      estimate: values.estimate,
      type: values.type,
      note: values.note,
    };
    axios(`${config.dataApi}dataset/${catalogueKey}/taxon/${taxon.id}`)
      .then((tx) => {
        const target = {
          id: _.get(tx, "data.name.id"),

          name: _.get(tx, "data.name.scientificName"),
          authorship: _.get(tx, "data.name.authorship"),
          rank: _.get(tx, "data.name.rank"),
        };
        return axios.all([
          axios.post(`${config.dataApi}dataset/${catalogueKey}/estimate`, {
            ...newEst,
            target: target,
          }),
          target,
        ]);
      })

      .then((res) => {
        setAddNewMode(false);
        setSubmissionError(null);
        setSelectedReference(null);
        setEstimates([
          { ...newEst, id: res[0].data, target: res[1] },
          ...estimates,
        ]);
        form.resetFields();
        notification.open({
          message: "Estimate created",
          description: `${values.estimate} est. species`,
        });
      })
      .catch((err) => {
        setSubmissionError(err);
        setSelectedReference(null);
      });
  };

  const toggleEdit = () => {
    setAddNewMode(!addNewMode);
  };

  const {
    taxon,
    onCancel,
    // form: { getFieldDecorator },
    catalogueKey,
    estimateType,
  } = props;
  //  const { estimates } = this.state;
  // const { visible, addNewMode, submissionError } = this.state;
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
  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 4,
        offset: 20,
      },
    },
  };
  return (
    <Modal
      width={1000}
      title={
        <span>
          Estimates for{" "}
          <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
        </span>
      }
      visible={visible}
      onOk={() => {
        setVisible(false);
        onCancel();
      }}
      onCancel={() => {
        setVisible(false);
        onCancel();
      }}
      destroyOnClose={true}
    >
      {!addNewMode && (
        <a onClick={toggleEdit}>
          <PlusOutlined /> Add new
        </a>
      )}
      {addNewMode && (
        <Form
          form={form}
          name="EstimateForm"
          onFinish={submitData}
          onFinishFailed={onFinishFailed}
        >
          <FormItem
            {...formItemLayout}
            label="Estimate"
            name="estimate"
            rules={[
              {
                required: true,
                message: "Estimate",
              },
            ]}
          >
            <Input type="number" />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="Type"
            name="type"
            rules={[
              {
                required: true,
                message: "Type",
              },
            ]}
          >
            <Select showSearch>
              {estimateType.map((o) => (
                <Option key={o} value={o}>
                  {o}
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem {...formItemLayout} label="Reference" name="reference">
            {
              <ReferenceAutocomplete
                datasetKey={catalogueKey}
                onSelectReference={setSelectedReference}
                onResetSearch={() => setSelectedReference(null)}
              />
            }
          </FormItem>
          <FormItem {...formItemLayout} label="Note" name="note">
            <Input />
          </FormItem>

          <FormItem {...tailFormItemLayout}>
            <Button style={{ marginRight: "10px" }}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => form.submit()}
            >
              Save
            </Button>
          </FormItem>
          {submissionError && (
            <FormItem>
              <Alert
                closable
                onClose={() => setSubmissionError(null)}
                message={<ErrorMsg error={submissionError} />}
                type="error"
              />
            </FormItem>
          )}
        </Form>
      )}

      {estimates && _.isArray(estimates) && (
        <EditableTable
          catalogueKey={catalogueKey}
          data={estimates}
          onDataUpdate={(estimates) => setEstimates(estimates)}
        />
      )}
    </Modal>
  );
};

// ##############################################################

const mapContextToProps = ({ estimateType }) => ({ estimateType });

export default withContext(mapContextToProps)(SpeciesestimateModal);
