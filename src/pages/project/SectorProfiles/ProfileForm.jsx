import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Alert, Typography, Divider, Tooltip } from "antd";
import withContext from "../../../components/hoc/withContext";
import ErrorMsg from "../../../components/ErrorMsg";
import SectorSettingsFields from "../../../components/SectorSettings/SectorSettingsFields";
import { cleanSettings, compactSettings } from "../../../components/SectorSettings/settingsMeta";
import { createProfile, updateProfile, previewProfile } from "../../../api/sector";
import { EMPTY_SELECTOR, normalizeSelector } from "./profileUtils";
import PublisherSelect from "./PublisherSelect";
import DatasetSelect from "./DatasetSelect";
import PreviewDrawer from "./PreviewDrawer";

const { Text } = Typography;
const formItemLayout = { labelCol: { span: 7 }, wrapperCol: { span: 16 } };
const toOptions = (values) => (values || []).map((v) => ({ value: v, label: v }));

const ProfileForm = ({ datasetKey, profile, nextPosition = 0, onSaved, onCancel, sectorMode, datasetType }) => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ selector: null, total: null, failed: false });
  const [showPreview, setShowPreview] = useState(false);
  const watchedSelector = Form.useWatch("selector", form);
  const modes = Form.useWatch(["selector", "modes"], form) || [];
  const latestRequest = useRef(0);
  const isNew = !profile?.id;

  // live preview, debounced; only the newest answer is shown
  const selectorJson = JSON.stringify(normalizeSelector(watchedSelector));
  useEffect(() => {
    const request = ++latestRequest.current;
    const selector = JSON.parse(selectorJson);
    const timer = setTimeout(() => {
      previewProfile(datasetKey, selector)
        .then((res) => {
          if (request === latestRequest.current) setPreview({ selector, total: res.total ?? 0, failed: false });
        })
        .catch(() => {
          if (request === latestRequest.current) setPreview({ selector, total: null, failed: true });
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [selectorJson, datasetKey]);

  const initialValues = isNew
    ? { position: nextPosition, selector: { ...EMPTY_SELECTOR }, settings: {} }
    : {
        ...profile,
        // the sector key tag input works on strings
        selector: { ...EMPTY_SELECTOR, ...profile.selector, sectorKeys: (profile.selector?.sectorKeys || []).map(String) },
      };

  const onFinish = async (values) => {
    setSaving(true);
    setError(null);
    const body = {
      ...(isNew ? {} : profile),
      title: values.title.trim(),
      description: values.description?.trim() || null,
      position: values.position ?? 0,
      selector: normalizeSelector(values.selector),
      // settings hidden for the selected modes keep what is stored
      settings: compactSettings({ ...profile?.settings, ...cleanSettings(values.settings) }),
    };
    try {
      if (isNew) {
        await createProfile(datasetKey, body);
      } else {
        await updateProfile(datasetKey, body);
      }
      setSaving(false);
      onSaved();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  const previewText = preview.failed ? (
    <Text type="warning">preview unavailable</Text>
  ) : preview.total === null ? (
    <Text type="secondary">…</Text>
  ) : (
    <>
      Selects <Text strong>{preview.total.toLocaleString("en-GB")}</Text> sectors{" "}
      {preview.total > 0 && <a onClick={() => setShowPreview(true)}>show</a>}
    </>
  );

  return (
    <Modal
      open
      title={isNew ? "New sector profile" : `Edit profile ${profile.title}`}
      width={800}
      okText="Save"
      onOk={() => form.submit()}
      confirmLoading={saving}
      onCancel={onCancel}
      mask={{ closable: false }}
    >
      {error && (
        <Alert
          type="error"
          style={{ marginBottom: "10px" }}
          closable={{ onClose: () => setError(null) }}
          description={<ErrorMsg error={error} />}
        />
      )}
      <Form form={form} initialValues={initialValues} onFinish={onFinish}>
        <Divider plain>Profile</Divider>
        <Form.Item {...formItemLayout} label="Title" name="title"
          rules={[{ required: true, whitespace: true, message: "A title is required" }]}>
          <Input />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Description" name="description">
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
        <Form.Item {...formItemLayout} name="position"
          label={<Tooltip color="green" title="Profiles apply in ascending position, a later one overrides an earlier one">Position</Tooltip>}>
          <InputNumber />
        </Form.Item>

        <Divider plain>Selects</Divider>
        <Form.Item {...formItemLayout} label=" " colon={false}>
          <Text type="secondary">
            Every field narrows the selection, the values within one field are alternatives. An empty selector
            selects every sector of the project.
          </Text>
        </Form.Item>
        <Form.Item {...formItemLayout} label="Modes" name={["selector", "modes"]}>
          <Select mode="multiple" allowClear placeholder="any mode" options={toOptions(sectorMode)} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Dataset types" name={["selector", "datasetTypes"]}>
          <Select mode="multiple" allowClear placeholder="any dataset type" options={toOptions(datasetType)} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Publishers" name={["selector", "publisherKeys"]}>
          <PublisherSelect datasetKey={datasetKey} />
        </Form.Item>
        <Form.Item {...formItemLayout} name={["selector", "anySectorPublisher"]} valuePropName="checked"
          label={<Tooltip color="green" title="Any of the project's sector publishers, including ones added later">Any sector publisher</Tooltip>}>
          <Switch />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Source datasets" name={["selector", "subjectDatasetKeys"]}>
          <DatasetSelect datasetKey={datasetKey} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Sectors" name={["selector", "sectorKeys"]}
          extra="Sector keys. You can also add sectors from the sector table.">
          <Select mode="tags" open={false} tokenSeparators={[",", " "]} placeholder="sector keys" />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Preview">
          {previewText}
        </Form.Item>

        <Divider plain>Settings</Divider>
        <Form.Item {...formItemLayout} label=" " colon={false}>
          <Text type="secondary">All optional. A setting left empty is inherited from earlier profiles or the defaults.</Text>
        </Form.Item>
        <SectorSettingsFields modes={modes} namePrefix={["settings"]} formItemLayout={formItemLayout} />
      </Form>
      <PreviewDrawer
        open={showPreview}
        onClose={() => setShowPreview(false)}
        datasetKey={datasetKey}
        selector={preview.selector}
      />
    </Modal>
  );
};

const mapContextToProps = ({ sectorMode, datasetType }) => ({ sectorMode, datasetType });

export default withContext(mapContextToProps)(ProfileForm);
