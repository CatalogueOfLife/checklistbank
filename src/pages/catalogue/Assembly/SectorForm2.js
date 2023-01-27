import React, { useState, useEffect } from "react";

import { notification, Select, Alert, Button, InputNumber, Form } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import TaxonFormControl from "../../../components/TaxonFormControl";
import DatasetFormControl from "../../../components/DatasetFormControl";
import ErrorMsg from "../../../components/ErrorMsg";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import NameAutocomplete from "./NameAutocomplete";
import SectorNote from "./SectorNote";
import withContext from "../../../components/hoc/withContext";
const FormItem = Form.Item;

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    xs: { span: 18 },
    sm: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 15 },
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
      offset: 19,
    },
  },
};

const SectorForm = ({
  sector,
  nomCode,
  entitytype,
 // sectorDatasetRanks,
  rank,
  onError,
  catalogueKey,
  onSubmit,
}) => {
  const [error, setError] = useState(null)
  const [form] = Form.useForm();
  const subjectDatasetKey = Form.useWatch("subjectDatasetKey", form);
  const mode = Form.useWatch('mode', form);

  const [sectorDatasetRanks, setSectorDatasetRanks] = useState([]);
  useEffect(() => {}, [sector, nomCode, entitytype, rank, sectorDatasetRanks]);
  useEffect(() =>{
      if(subjectDatasetKey || sector?.subjectDatasetKey){
        axios
        .get(
          `${config.dataApi}dataset/${subjectDatasetKey || sector?.subjectDatasetKey}/nameusage/search?facet=rank&limit=0`
        ) // /assembly/3/sync/
        .then((res) => {
          setSectorDatasetRanks(_.get(res, "data.facets.rank", []).map(
              (r) => r.value
            ))
        })
        .catch((err) => {
          setError(err)
        });
      }
    }, [subjectDatasetKey])
  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const submitData = (values) => {
    if (sector) {
      axios
        .put(
          `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
          { ...sector, ...values }
        )
        .then(() => {
          notification.open({
            message: "Sector updated",
            description: "Sector updated",
          });
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(values);
          }
        })
        .catch((err) => {
            setError(err)
          if (typeof onError === "function") {
            onError(err);
          }
        });
    } else {
      axios
        .post(`${config.dataApi}dataset/${catalogueKey}/sector`, values)
        .then(() => {
          notification.open({
            message: "Sector created",
            description: "Sector created",
          });
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(values);
          }
        })
        .catch((err) => {
            setError(err)
          if (typeof onError === "function") {
            onError(err);
          }
        });
    }
  };

  const initialValues = { ranks: [], entities: [], ...sector };
  return (<>
   {error && <Alert
                  style={{ marginBottom: "10px" }}
                  description={<ErrorMsg error={error} />}
                  type="error"
                  closable
                  onClose={() => setError(null)}
                />}
    <Form
      form={form}
      initialValues={initialValues}
      onFinish={submitData}
      onFinishFailed={onFinishFailed}
    >
      <FormItem {...formItemLayout} label="Mode" key="mode" name="mode" required>
        <Select
          style={{ width: "100%" }}
          // defaultValue={sector.mode}
          // onChange={(value) => updateSectorMode(value)}
          showSearch
          allowClear
        >
          <Option key="attach" value="attach">
            attach
          </Option>
          <Option key="union" value="union">
            union
          </Option>
          <Option key="merge" value="merge">
            merge
          </Option>
        </Select>
      </FormItem>
      {mode === "merge" && 
        <FormItem {...formItemLayout} label="Priority" key="priority" name="priority">
        
        <InputNumber />
        </FormItem>}
      {!sector && (
        <FormItem
          {...formItemLayout}
          label="Subject Dataset"
          key="subjectDatasetKey"
          name="subjectDatasetKey"
          required
        >
          <DatasetFormControl />
        </FormItem>
      )}
      <FormItem {...formItemLayout} label="Code" key="code" name="code">
        <Select style={{ width: "100%" }} showSearch allowClear>
          {nomCode.map((f) => {
            return (
              <Option key={f.name} value={f.name}>
                {f.name}
              </Option>
            );
          })}
        </Select>
      </FormItem>

      <FormItem {...formItemLayout} label="Ranks" key="ranks" name="ranks">
        <Select style={{ width: "100%" }} mode="multiple" showSearch allowClear disabled={sectorDatasetRanks.length === 0}>
          {(sectorDatasetRanks || []).map((r) => {
            return (
              <Option key={r} value={r}>
                {r}
              </Option>
            );
          })}
        </Select>
      </FormItem>

      <FormItem
        {...formItemLayout}
        label="Entities"
        key="entities"
        name="entities"
      >
        <Select mode="multiple" style={{ width: "100%" }} showSearch allowClear>
          {entitytype.map((f) => {
            return (
              <Option key={f.name} value={f.name}>
                {f.name}
              </Option>
            );
          })}
        </Select>
      </FormItem>

      <FormItem {...formItemLayout} label="Target" key="target" name="target">
        <TaxonFormControl
          minRank="genus"
          accepted={true}
          datasetKey={sector?.datasetKey || catalogueKey}
          defaultTaxonKey={_.get(sector, "target.id") || null}
        />
      </FormItem>

      <FormItem
        {...formItemLayout}
        label="Subject"
        key="subject"
        name="subject"
      >
        <TaxonFormControl
          disabled={!sector && !subjectDatasetKey}
          minRank="genus"
          accepted={true}
          datasetKey={sector ? sector.subjectDatasetKey : subjectDatasetKey}
          defaultTaxonKey={_.get(sector, "subject.id") || null}
        />
      </FormItem>

      <FormItem
        {...formItemLayout}
        label="Placeholder Rank"
        key="placeholderRank"
        name="placeholderRank"
      >
        <Select style={{ width: "100%" }} showSearch allowClear>
          {rank.map((r) => {
            return (
              <Option key={r} value={r}>
                {r}
              </Option>
            );
          })}
        </Select>
      </FormItem>

      <FormItem {...tailFormItemLayout}>
        <Button type="primary" onClick={form.submit}>
          Save
        </Button>
      </FormItem>
    </Form>
    </>);
};

const mapContextToProps = ({ nomCode, entitytype, rank, catalogueKey }) => ({
  catalogueKey,
  nomCode,
  entitytype,
  rank,
});
export default withContext(mapContextToProps)(SectorForm);
