import React, { useState, useEffect } from "react";

import { App, Select, Checkbox, Input, Alert, Button, InputNumber, Form, Divider, Tooltip, Typography } from "antd";
import TaxonFormControl from "../../../components/TaxonFormControl";
import DatasetFormControl from "../../../components/DatasetFormControl";
import ErrorMsg from "../../../components/ErrorMsg";
import SectorSettingsFields from "../../../components/SectorSettings/SectorSettingsFields";
import { cleanSettings } from "../../../components/SectorSettings/settingsMeta";
import { getEffectiveSettings, getProfiles } from "../../../api/sector";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";

const FormItem = Form.Item;
const { Text } = Typography;

const currentId = (taxon) =>
  taxon?.id ? (
    <Text code copyable>{taxon.id}</Text>
  ) : null;

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

const SectorForm = ({ sector, rank, onError, projectKey, onSubmit }) => {
  const { notification } = App.useApp();
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const subjectDatasetKey = Form.useWatch("subjectDatasetKey", form);
  const mode = Form.useWatch("mode", form);
  const subject = Form.useWatch("subject", form);
  const target = Form.useWatch("target", form);
  const [existingHierarchySector, setExistingHierarchySector] = useState(null);

  const [sectorDatasetRanks, setSectorDatasetRanks] = useState([]);
  const [effective, setEffective] = useState(null);
  // the sector as last saved: the prop stays stale while the form remains open after a save
  const [saved, setSaved] = useState(sector);
  useEffect(() => {
    setSaved(sector);
  }, [sector]);
  const [profiles, setProfiles] = useState([]);

  const loadEffective = () => {
    if (!sector?.id) return;
    getEffectiveSettings(sector.datasetKey, sector.id)
      .then(setEffective)
      // without them the form still works, just without the inherited hints
      .catch(() => setEffective(null));
  };

  useEffect(() => {
    loadEffective();
    const key = sector?.datasetKey || projectKey;
    if (key) {
      getProfiles(key).then(setProfiles).catch(() => setProfiles([]));
    }
  }, [sector?.id, sector?.datasetKey, projectKey]);
  useEffect(() => {
    if (mode === "hierarchy" && !sector) {
      axios
        .get(`${config.dataApi}dataset/${projectKey}/sector?mode=hierarchy&limit=1`)
        .then((res) => {
          setExistingHierarchySector(_.get(res, "data.result[0]", null));
        })
        .catch(() => setExistingHierarchySector(null));
    } else {
      setExistingHierarchySector(null);
    }
  }, [mode]);

  useEffect(() => {
    if (subjectDatasetKey || sector?.subjectDatasetKey) {
      // facetLimit defaults to 10, so without it the rank list is silently
      // truncated to the 10 most frequent ranks of the source dataset
      axios
        .get(
          `${config.dataApi}dataset/${
            subjectDatasetKey || sector?.subjectDatasetKey
          }/nameusage/search?facet=rank&facetLimit=500&limit=0`
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
    // Inherit, empty lists and blank strings go out as null so the profiles apply
    const body = { ...values, ...cleanSettings(values) };
    if (sector) {
      axios
        .put(
          `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
          { ...saved, ...body }
        )
        .then(() => {
          notification.open({
            title: "Sector updated",
            description: "Sector updated",
          });
          setSaved((prev) => ({ ...prev, ...body }));
          loadEffective();
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(body);
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
        .post(`${config.dataApi}dataset/${projectKey}/sector`, body)
        .then(() => {
          notification.open({
            title: "Sector created",
            description: "Sector created",
          });
          if (onSubmit && typeof onSubmit === "function") {
            onSubmit(body);
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
    useXRelease: true,
    ...sector,
  };
  return (
    <>
      {error && (
        <Alert
          style={{ marginBottom: "10px" }}
          description={<ErrorMsg error={error} />}
          type="error"
          closable={{ onClose: () => setError(null) }}
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
            options={[
              { value: "attach", label: "attach" },
              { value: "union", label: "union" },
              { value: "merge", label: "merge" },
              { value: "hierarchy", label: "hierarchy" },
            ]}
          />
        </FormItem>
        {mode === "hierarchy" && !sector && existingHierarchySector && (
          <Alert
            style={{ marginBottom: "10px" }}
            title="A hierarchy sector already exists for this project. Only one is allowed."
            type="warning"
            showIcon
          />
        )}
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

        {mode !== "hierarchy" && (
          <FormItem
            {...formItemLayout}
            label={<Tooltip color='green' title="Select the sector's root taxon in the source (subject) dataset. Not required for merge sectors.">Subject</Tooltip>}
            key="subject"
            name="subject"
            extra={currentId(subject)}
          >
            <TaxonFormControl
              disabled={!sector && !subjectDatasetKey}
              accepted={true}
              datasetKey={sector ? sector.subjectDatasetKey : subjectDatasetKey}
              defaultTaxonKey={_.get(sector, "subject.id") || null}
            />
          </FormItem>
        )}

        {mode !== "hierarchy" && (
          <FormItem {...formItemLayout}
            label={<Tooltip color='green' title="Under which taxon in the project should the synced names be copied to? Not required for merge sectors.">Target</Tooltip>}
            key="target" name="target"
            extra={currentId(target)}
          >
            <TaxonFormControl
              accepted={true}
              datasetKey={sector?.datasetKey || projectKey}
              defaultTaxonKey={_.get(sector, "target.id") || null}
            />
          </FormItem>
        )}

        <FormItem
          {...formItemLayout}
          label={<Tooltip color='green' title="Optionally ignore immediate children of the source subject which are above the selected rank.">Placeholder Rank</Tooltip>}
          key="placeholderRank"
          name="placeholderRank"
        >
          <Select
            style={{ width: "100%" }}
            showSearch
            allowClear
            options={rank.map((r) => ({ value: r, label: r }))}
          />
        </FormItem>

        <SectorSettingsFields
          modes={mode ? [mode] : []}
          rankOptions={sectorDatasetRanks}
          effective={effective}
          own={saved || {}}
          profiles={profiles}
          profilesPath={`/project/${sector?.datasetKey || projectKey}/sector/profiles`}
          formItemLayout={formItemLayout}
        />

        {mode === "hierarchy" && (
          <FormItem
            {...formItemLayout}
            label={<Tooltip color="green" title="Use the latest extended (not base) release of the subject project as the hierarchy source. Only relevant when subjectDatasetKey is a project.">Use X Release</Tooltip>}
            key="useXRelease"
            name="useXRelease"
            valuePropName="checked"
          >
            <Checkbox />
          </FormItem>
        )}

        <Divider plain>Editorial notes</Divider>

        <FormItem key="note" name="note">
          <TextArea />
        </FormItem>

        <FormItem {...tailFormItemLayout}>
          <Button
            type="primary"
            onClick={form.submit}
            disabled={mode === "hierarchy" && !sector && !!existingHierarchySector}
          >
            Save
          </Button>
        </FormItem>
      </Form>
    </>
  );
};

const mapContextToProps = ({ rank, projectKey }) => ({ rank, projectKey });
export default withContext(mapContextToProps)(SectorForm);
