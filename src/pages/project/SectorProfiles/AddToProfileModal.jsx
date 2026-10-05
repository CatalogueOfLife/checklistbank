import React, { useEffect, useState } from "react";
import { Modal, Select, Radio, Alert, App } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import { getProfiles, getProfile, updateProfile } from "../../../api/sector";
import { addToSelector, normalizeSelector } from "./profileUtils";

// Appends the selected sectors, or their source datasets, to the selector of a profile
const AddToProfileModal = ({ open, onClose, datasetKey, sectors = [] }) => {
  const { notification } = App.useApp();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [what, setWhat] = useState("sectors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      getProfiles(datasetKey).then(setProfiles).catch(setError);
    }
  }, [open, datasetKey]);

  const field = what === "datasets" ? "subjectDatasetKeys" : "sectorKeys";
  const selected = profiles.find((p) => p.id === profileId);
  // selector fields are ANDed: adding the first keys narrows the profile to just these
  const narrows = selected && normalizeSelector(selected.selector)[field].length === 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const profile = await getProfile(datasetKey, profileId);
      const { selector, added } = addToSelector(profile.selector, sectors, what);
      await updateProfile(datasetKey, { ...profile, selector });
      notification.success({
        title: `Added ${added} ${what === "datasets" ? "source dataset" : "sector"} key${added === 1 ? "" : "s"} to ${profile.title}`,
      });
      setSaving(false);
      onClose(true);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Add ${sectors.length} sectors to a profile`}
      okText="Add"
      okButtonProps={{ disabled: !profileId }}
      confirmLoading={saving}
      onOk={save}
      onCancel={() => onClose(false)}
      destroyOnHidden
    >
      {error && <Alert type="error" style={{ marginBottom: "10px" }} description={<ErrorMsg error={error} />} />}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Select
          style={{ width: "100%" }}
          placeholder="Profile"
          value={profileId}
          onChange={setProfileId}
          options={profiles.map((p) => ({ value: p.id, label: p.title }))}
        />
        <Radio.Group value={what} onChange={(e) => setWhat(e.target.value)}>
          <Radio value="sectors">these sectors</Radio>
          <Radio value="datasets">their source datasets</Radio>
        </Radio.Group>
        {narrows && (
          <Alert
            type="warning"
            showIcon
            title={`${selected.title} selects no ${
              what === "datasets" ? "source datasets" : "sectors"
            } by key yet. Adding these limits it to them alone.`}
          />
        )}
      </div>
    </Modal>
  );
};

export default AddToProfileModal;
