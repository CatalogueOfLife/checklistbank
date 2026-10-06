import React, { useEffect, useState } from "react";
import { Spin, Typography } from "antd";
import PresentationItem from "../PresentationItem";
import withContext from "../hoc/withContext";
import SourceTags from "./SourceTags";
import { getEffectiveSettings, getProfiles } from "../../api/sector";
import { SETTINGS, appliesTo, parseSources, formatValue } from "./settingsMeta";

const names = (list) => (list || []).map((e) => (typeof e === "string" ? e : e.name));

// The settings a sync of the sector uses. Lists every setting a profile or the sector sets, and the ranks always,
// so a publisher sector with no ranks of its own does not read as syncing all ranks. Settings the sector's mode
// does not read are left out.
const EffectiveSettingsSummary = ({ datasetKey, sectorId, mode, profilesPath, rank, entitytype, nametype }) => {
  const [effective, setEffective] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setEffective(null);
    getEffectiveSettings(datasetKey, sectorId).then(setEffective).catch(() => setFailed(true));
    getProfiles(datasetKey).then(setProfiles).catch(() => setProfiles([]));
  }, [datasetKey, sectorId]);

  if (failed) return <Typography.Text type="secondary">Sync settings unavailable</Typography.Text>;
  if (!effective) return <Spin size="small" />;

  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const allValues = { ranks: names(rank), entities: names(entitytype), nameTypes: names(nametype) };
  const shown = SETTINGS.filter(
    (s) =>
      appliesTo(s, mode ? [mode] : []) &&
      (s.name === "ranks" ||
        parseSources(effective.sources?.[s.name]).some((src) => src.type !== "default"))
  );
  return shown.map((s) => (
    <PresentationItem key={s.name} label={s.label}>
      {formatValue(s, effective.settings?.[s.name], allValues[s.name])}{" "}
      <SourceTags source={effective.sources?.[s.name]} profiles={byId} profilesPath={profilesPath} />
    </PresentationItem>
  ));
};

const mapContextToProps = ({ rank, entitytype, nametype }) => ({ rank, entitytype, nametype });

export default withContext(mapContextToProps)(EffectiveSettingsSummary);
