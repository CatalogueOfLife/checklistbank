import React, { useEffect, useRef, useState } from "react";
import { Modal, Select, Radio, Alert, Typography, App } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import { getProfiles, getProfile, updateProfile, countProfileSectors, previewProfile } from "../../../api/sector";
import { addToSelector, restrictToSectors } from "./profileUtils";

const { Text } = Typography;
const fmt = (n) => n.toLocaleString("en-GB");

// Appends the selected sectors, or their source datasets, to the selector of a profile.
// Selector fields are ANDed, so appending keys can narrow a profile or still leave the sectors out:
// the modal previews both before saving.
const AddToProfileModal = ({ open, onClose, datasetKey, sectors = [] }) => {
  const { notification } = App.useApp();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [what, setWhat] = useState("sectors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // {before, after, matched}: sectors the profile selects now and afterwards, and how many of the chosen ones
  const [impact, setImpact] = useState(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    if (open) {
      setError(null);
      getProfiles(datasetKey).then(setProfiles).catch(setError);
    }
  }, [open, datasetKey]);

  const selected = profiles.find((p) => p.id === profileId);
  // a stable dependency: the sectors prop is a new array on every render of a parent without a selection
  const sectorIds = sectors.map((s) => `${s.id}:${s.subjectDatasetKey}`).join(",");

  useEffect(() => {
    setImpact(null);
    if (!selected) return;
    const request = ++latestRequest.current;
    const { selector } = addToSelector(selected.selector, sectors, what);
    const mine = restrictToSectors(selector, sectors.map((s) => s.id));
    Promise.all([
      countProfileSectors(datasetKey, selected.id),
      previewProfile(datasetKey, selector).then((res) => res.total ?? 0),
      mine ? previewProfile(datasetKey, mine).then((res) => res.total ?? 0) : Promise.resolve(0),
    ])
      .then(([before, after, matched]) => {
        if (request === latestRequest.current) setImpact({ before, after, matched });
      })
      .catch(() => {
        if (request === latestRequest.current) setImpact(null);
      });
  }, [selected, what, sectorIds, datasetKey]);

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

  const shrinks = impact && impact.after < impact.before;
  const missed = impact ? sectors.length - impact.matched : 0;

  return (
    <Modal
      open={open}
      title={`Add ${sectors.length} sectors to a profile`}
      okText="Add"
      okButtonProps={{ disabled: !profileId, danger: !!shrinks }}
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
        {selected && !impact && <Text type="secondary">…</Text>}
        {selected && impact && (
          <Text>
            {selected.title} applies to {fmt(impact.before)} sectors now and to {fmt(impact.after)} afterwards.{" "}
            {fmt(impact.matched)} of the {fmt(sectors.length)} selected sectors would get its settings.
          </Text>
        )}
        {shrinks && (
          <Alert
            type="warning"
            showIcon
            title={`The profile would no longer apply to ${fmt(impact.before - impact.after)} sectors it applies to now.`}
          />
        )}
        {missed > 0 && (
          <Alert
            type="warning"
            showIcon
            title={`${fmt(missed)} of the selected sectors would still not be selected, because the profile's other selector fields exclude them.`}
          />
        )}
      </div>
    </Modal>
  );
};

export default AddToProfileModal;
