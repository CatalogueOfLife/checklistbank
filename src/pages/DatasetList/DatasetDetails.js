import React, { useState, useEffect } from "react";
import axios from "axios";
import { Descriptions, Spin } from "antd";
import moment from "moment";
import config from "../../config";
import TaxGroupIcon, { filterRedundantGroups } from "../NameSearch/TaxGroupIcon";
import Releases from "./Releases";
import withContext from "../../components/hoc/withContext";

const userCache = {};

const fetchUsername = async (userId) => {
  if (!userId) return null;
  if (userCache[userId] !== undefined) return userCache[userId];
  try {
    const res = await axios(`${config.dataApi}user/${userId}`);
    userCache[userId] = res.data.username || null;
  } catch {
    userCache[userId] = null;
  }
  return userCache[userId];
};

const agentNames = (agents) =>
  Array.isArray(agents) && agents.length > 0
    ? agents.map((a) => a.name).filter(Boolean).join(", ")
    : null;

const doiLink = (doi) =>
  doi ? (
    <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">
      {doi}
    </a>
  ) : null;

const labelStyle = { fontWeight: "bold" };
const descProps = { size: "small", labelStyle };

// For middle rows: hidden when empty
const di = (key, label, value, span = 3) =>
  value != null && value !== ""
    ? <Descriptions.Item key={key} label={label} span={span}>{value}</Descriptions.Item>
    : null;

// For fixed-layout rows: always rendered, greyed out when empty
const diFixed = (key, label, value, span = 1) => (
  <Descriptions.Item key={key} label={label} span={span}>
    {value != null && value !== ""
      ? value
      : <span style={{ color: "#bbb" }}>No information</span>}
  </Descriptions.Item>
);

const DatasetDetails = ({ record, taxGroup }) => {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    if (!record?.key) return;
    setLoading(true);
    axios(`${config.dataApi}dataset/${record.key}`)
      .then((res) => {
        setDataset(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [record?.key]);

  useEffect(() => {
    if (!dataset) return;
    const ids = [dataset.createdBy, dataset.modifiedBy].filter(Boolean);
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => fetchUsername(id).then((name) => [id, name])))
      .then((entries) => setUsernames(Object.fromEntries(entries)));
  }, [dataset]);

  if (loading) return <Spin style={{ margin: "16px 48px" }} />;
  if (!dataset) return null;

  const d = dataset;

  const withUser = (date, userId) => {
    if (!date) return null;
    const formatted = moment(date).format("MMM Do YYYY");
    const name = usernames[userId];
    return name ? `${formatted} (${name})` : formatted;
  };

  const groupCoverageValue = (() => {
    const groups = filterRedundantGroups(d.taxonomicGroupScope, taxGroup);
    if (!groups || groups.length === 0) return null;
    return (
      <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        {groups.map((g) => <TaxGroupIcon key={g} group={g} size={18} />)}
      </span>
    );
  })();

  return (
    <div style={{ marginLeft: 48, padding: "8px 16px 16px 0" }}>
      <Descriptions {...descProps} column={3}>
        {/* Row 1: always 3 fixed slots */}
        {diFixed("key",        "Key",         String(d.key))}
        {diFixed("doi",        "DOI",         doiLink(d.doi))}
        {diFixed("versionDoi", "Version DOI", doiLink(d.versionDoi))}

        {/* Row 2: alias (×2) + version — always fixed */}
        {diFixed("alias",   "Alias",   d.alias,     2)}
        {diFixed("version", "Version", d.version,   1)}

        {/* Middle rows: hidden when empty */}
        {[
          di("title",       "Title",           d.title),
          di("keywords",    "Keywords",        Array.isArray(d.keyword) && d.keyword.length > 0 ? d.keyword.join(", ") : null),
          di("license",     "License",         d.license),
          di("publisher",   "Publisher",       d.publisher?.name),
          di("creator",     "Creator",         agentNames(d.creator)),
          di("editor",      "Editor",          agentNames(d.editor)),
          di("geoScope",    "Geographic Scope", d.geographicScope),
          di("taxScope",    "Taxonomic Scope",  d.taxonomicScope),
          di("groupScope",  "Group Coverage",   groupCoverageValue),
          di("description", "Description",     d.description),
          di("notes",       "Notes",           d.notes),
        ].filter(Boolean)}

        {/* Last row: always 3 fixed slots */}
        {diFixed("created",  "Created",  withUser(d.created,  d.createdBy))}
        {diFixed("modified", "Modified", withUser(d.modified, d.modifiedBy))}
        {diFixed("imported", "Imported", d.imported ? moment(d.imported).format("MMM Do YYYY") : null)}
      </Descriptions>

      {record.origin === "project" && (
        <div style={{ marginTop: 16 }}>
          <Releases dataset={d} />
        </div>
      )}
    </div>
  );
};

const mapContextToProps = ({ taxGroup }) => ({ taxGroup });
export default withContext(mapContextToProps)(DatasetDetails);
