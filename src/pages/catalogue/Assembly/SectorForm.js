import React, { useState, useEffect } from "react";

import {
  notification,
  Select,
  Checkbox,
  Input,
  Alert,
  Button,
  InputNumber,
  Form,
  Divider,
  Tooltip,
  Radio,
} from "antd";
import TaxonFormControl from "../../../components/TaxonFormControl";
import DatasetFormControl from "../../../components/DatasetFormControl";
import ErrorMsg from "../../../components/ErrorMsg";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import {
  InfoCircleOutlined,
} from "@ant-design/icons";

const FormItem = Form.Item;

const { Option } = Select;
const { TextArea } = Input;

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
  nametype,
  nomstatus,
}) => {
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const subjectDatasetKey = Form.useWatch("subjectDatasetKey", form);
  const mode = Form.useWatch("mode", form);

  const [sectorDatasetRanks, setSectorDatasetRanks] = useState([]);
  useEffect(() => {
    console.log(sector?.nameTypes);
  }, [sector, nomCode, entitytype, rank, sectorDatasetRanks]);
  useEffect(() => {
    if (subjectDatasetKey || sector?.subjectDatasetKey) {
      axios
        .get(
          `${config.dataApi}dataset/${
            subjectDatasetKey || sector?.subjectDatasetKey
          }/nameusage/search?facet=rank&limit=0`
        ) // /assembly/3/sync/
        .then((res) => {
          setSectorDatasetRanks(
            _.get(res, "data.facets.rank", []).map((r) => r.value)
          );
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [subjectDatasetKey]);
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
          setError(err);
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
          setError(err);
          if (typeof onError === "function") {
            onError(err);
          }
        });
    }
  };

  const initialValues = {
    ranks: [],
    entities: [],
    nameTypes: [],
    nameStatusExclusion: [],
    ...sector,
  };
  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: "10px" }}
          description={<ErrorMsg error={error} />}
          type="error"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={submitData}
        onFinishFailed={onFinishFailed}
      >
        <FormItem
          {...formItemLayout}
          label="Mode"
          key="mode"
          name="mode"
          required
        >
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
        {mode === "merge" && (
          <FormItem
            {...formItemLayout}
            label="Priority"
            key="priority"
            name="priority"
          >
            <InputNumber />
          </FormItem>
        )}
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

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Select the sector's root taxon in the source (subject) dataset. Not required for merge sectors.">Subject</Tooltip>}
          key="subject"
          name="subject"
        >
          <TaxonFormControl
            disabled={!sector && !subjectDatasetKey}
            accepted={true}
            datasetKey={sector ? sector.subjectDatasetKey : subjectDatasetKey}
            defaultTaxonKey={_.get(sector, "subject.id") || null}
          />
        </FormItem>

        <FormItem {...formItemLayout} 
          label={<Tooltip color='green' title="Under which taxon in the project should the synced names be copied to? Not required for merge sectors.">Target</Tooltip>}
          key="target" name="target"
        >
          <TaxonFormControl
            accepted={true}
            datasetKey={sector?.datasetKey || catalogueKey}
            defaultTaxonKey={_.get(sector, "target.id") || null}
          />
        </FormItem>

        <Divider plain>Filter</Divider>

        <FormItem {...formItemLayout} 
          label={<Tooltip color='green' title="Include only names with selected ranks">Ranks</Tooltip>}
          key="ranks" name="ranks"
        >
          <Select
            style={{ width: "100%" }}
            mode="multiple"
            showSearch
            allowClear
            disabled={sectorDatasetRanks.length === 0}
          >
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
          label={<Tooltip color='green' title="Optionally ignore immediate children of the source subject which are above the selected rank.">Placeholder Rank</Tooltip>}
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

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Include only names of the selected name types">Name Types</Tooltip>}
          key="nameTypes"
          name="nameTypes"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            showSearch
            allowClear
          >
            {nametype.map((f) => {
              return (
                <Option key={f} value={f}>
                  {f}
                </Option>
              );
            })}
          </Select>
        </FormItem>

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Exclude names with the selected nomenclatural status">Name Status</Tooltip>}
          key="nameStatusExclusion"
          name="nameStatusExclusion"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            showSearch
            allowClear
          >
            {nomstatus.map((f) => {
              return (
                <Option key={f.name} value={f.name}>
                  {f.name}
                </Option>
              );
            })}
          </Select>
        </FormItem>

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Optionally restrict taxa to be synced to extinct or extant only">Extinct Status</Tooltip>}
          key="extinctFilter"
          name="extinctFilter"
        >
          <Radio.Group defaultValue={null} optionType="button" buttonStyle="solid">
            <Radio value={null}>All</Radio>
            <Radio value={true}>Extinct</Radio>
            <Radio value={false}>Extant</Radio>
          </Radio.Group>
        </FormItem>

        <Divider plain>Data to sync</Divider>

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Which record entities to sync. Defaults to all">Entities</Tooltip>}
          key="entities"
          name="entities"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            showSearch
            allowClear
          >
            {entitytype.map((f) => {
              return (
                <Option key={f.name} value={f.name}>
                  {f.name}
                </Option>
              );
            })}
          </Select>
        </FormItem>

        <FormItem {...formItemLayout} 
          label={<Tooltip color='green' title="The default nomenclatural code to apply during syncs">Code</Tooltip>}
          key="code" name="code"
        >
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

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Copies also the accordingTo taxon reference of the name usage. Off by default.">AccordingTo</Tooltip>}
          key="copyAccordingTo"
          name="copyAccordingTo"
          valuePropName="checked"
        >
          <Checkbox />          
        
        </FormItem>

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Removes the custom taxon sort order from source data">Remove Ordinals</Tooltip>}
          key="removeOrdinals"
          name="removeOrdinals"
          valuePropName="checked"
        >
          <Checkbox />
        </FormItem>

        <Divider plain>Editorial notes</Divider>

        <FormItem key="note" name="note">
          <TextArea />
        </FormItem>

        <FormItem {...tailFormItemLayout}>
          <Button type="primary" onClick={form.submit}>
            Save
          </Button>
        </FormItem>
      </Form>
    </>
  );
};

const mapContextToProps = ({
  nomCode,
  entitytype,
  rank,
  catalogueKey,
  nametype,
  nomstatus,
}) => ({
  catalogueKey,
  nomCode,
  entitytype,
  rank,
  nametype,
  nomstatus,
});
export default withContext(mapContextToProps)(SectorForm);
