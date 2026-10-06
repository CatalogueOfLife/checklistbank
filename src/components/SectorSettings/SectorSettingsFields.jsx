import React from "react";
import { Form, Select, Input, Divider, Tooltip, Tag } from "antd";
import withContext from "../hoc/withContext";
import TriStateRadio from "./TriStateRadio";
import { ProfileLinks } from "./SourceTags";
import {
  SETTINGS,
  SETTING_GROUPS,
  appliesTo,
  parseSources,
  inheritedPart,
  formatValue,
} from "./settingsMeta";

// enums arrive as plain strings (rank, nametype) or as {name} objects (nomstatus, issue, ...)
const names = (list) => (list || []).map((e) => (typeof e === "string" ? e : e.name));
const toOptions = (values) => values.map((v) => ({ value: v, label: v }));

// Under a field: what the sector inherits for it and from where. Null when the sector sets it itself.
const inheritedHint = ({ setting, effective, own, profiles, profilesPath, allValues }) => {
  if (!effective) return null;
  const value = effective.settings?.[setting.name];
  const sources = parseSources(effective.sources?.[setting.name]);
  const profileIds = sources.filter((s) => s.type === "profile").map((s) => s.id);
  if (setting.union) {
    // blocklists add up: show what other levels add, the field holds the sector's own entries
    const inherited = inheritedPart(value, own);
    if (!inherited.length) return null;
    return (
      <span>
        plus inherited{" "}
        {inherited.map((v) => (
          <Tag key={v}>{v}</Tag>
        ))}
        from <ProfileLinks ids={profileIds} profiles={profiles} profilesPath={profilesPath} />
      </span>
    );
  }
  if (sources.some((s) => s.type === "sector")) return null;
  const shown = formatValue(setting, value, allValues);
  if (!profileIds.length) return <span>default: {shown}</span>;
  return (
    <span>
      inherits {shown} from <ProfileLinks ids={profileIds} profiles={profiles} profilesPath={profilesPath} />
    </span>
  );
};

// The sync settings shared by sectors and sector profiles, rendered into the surrounding Form.
// Every field can stay unset, which means inherit.
const SectorSettingsFields = ({
  modes = [],
  namePrefix = [],
  rankOptions,
  effective,
  own = {},
  profiles = [],
  profilesPath,
  formItemLayout = {},
  rank,
  nametype,
  nomstatus,
  entitytype,
  nomCode,
  issue,
  sectorAuthorshipUpdate,
}) => {
  const all = {
    ranks: names(rank),
    nameTypes: names(nametype),
    nameStatusExclusion: names(nomstatus),
    entities: names(entitytype),
    code: names(nomCode),
    authorshipUpdate: names(sectorAuthorshipUpdate),
    issueExclusion: names(issue),
  };
  // the sector form offers the ranks of its source dataset, a profile all ranks
  const choices = { ...all, ranks: rankOptions?.length ? rankOptions : all.ranks };
  const profileById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const inheritedBool = (s) => {
    if (!effective) return null;
    if (parseSources(effective.sources?.[s.name]).some((src) => src.type === "sector")) return null;
    return formatValue(s, effective.settings?.[s.name]);
  };

  const widget = (s) => {
    switch (s.kind) {
      case "enums":
        return (
          <Select mode="multiple" style={{ width: "100%" }} allowClear placeholder="inherit"
            options={toOptions(choices[s.name])} />
        );
      case "enum":
        return (
          <Select style={{ width: "100%" }} showSearch allowClear placeholder="inherit"
            options={toOptions(choices[s.name])} />
        );
      case "lines":
        // one entry per line: commas are valid inside names and regular expressions
        return <Input.TextArea rows={4} placeholder={s.placeholder} />;
      case "regex":
        return <Input allowClear placeholder="inherit" />;
      case "bool":
        return <TriStateRadio yes={s.yes} no={s.no} inherited={inheritedBool(s)} />;
      default:
        return null;
    }
  };

  return SETTING_GROUPS.map((g) => {
    const settings = SETTINGS.filter((s) => s.group === g.key && appliesTo(s, modes));
    if (!settings.length) return null;
    return (
      <React.Fragment key={g.key}>
        <Divider plain>{g.title}</Divider>
        {settings.map((s) => (
          <Form.Item
            {...formItemLayout}
            key={s.name}
            name={[...namePrefix, s.name]}
            // an unset regex is null, which an Input must not receive as its value
            {...(s.kind === "regex" ? { getValueProps: (v) => ({ value: v ?? "" }) } : {})}
            // the list is edited as text; blank lines are kept while typing and dropped by cleanSettings
            {...(s.kind === "lines"
              ? { getValueProps: (v) => ({ value: (v || []).join("\n") }), normalize: (v) => (v ? v.split("\n") : []) }
              : {})}
            label={<Tooltip color="green" title={s.help}>{s.label}</Tooltip>}
            extra={inheritedHint({
              setting: s,
              effective,
              own: own[s.name],
              profiles: profileById,
              profilesPath,
              allValues: all[s.name],
            })}
          >
            {widget(s)}
          </Form.Item>
        ))}
      </React.Fragment>
    );
  });
};

const mapContextToProps = ({ rank, nametype, nomstatus, entitytype, nomCode, issue, sectorAuthorshipUpdate }) => ({
  rank,
  nametype,
  nomstatus,
  entitytype,
  nomCode,
  issue,
  sectorAuthorshipUpdate,
});

export default withContext(mapContextToProps)(SectorSettingsFields);
