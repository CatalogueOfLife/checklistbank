import React, { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import config from "../../../config";

const axiosNoAuth = axios.create({ headers: { Authorization: null } });

// Multiple GBIF publishers: suggests the project's sector publishers, searches GBIF while typing
const PublisherSelect = ({ value = [], onChange, datasetKey }) => {
  const [sectorPublishers, setSectorPublishers] = useState([]);
  const [found, setFound] = useState([]);
  const [q, setQ] = useState("");
  // labels of selected publishers that are no sector publishers
  const [labels, setLabels] = useState({});

  useEffect(() => {
    axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher?limit=1000`)
      .then((res) =>
        setSectorPublishers((res.data?.result || []).map((p) => ({ value: p.id, label: p.alias || p.title })))
      )
      .catch(() => setSectorPublishers([]));
  }, [datasetKey]);

  useEffect(() => {
    const known = new Set([...sectorPublishers.map((o) => o.value), ...Object.keys(labels)]);
    (value || [])
      .filter((k) => !known.has(k))
      .forEach((k) =>
        axiosNoAuth(`${config.gbifApi}organization/${k}`)
          .then((res) => setLabels((prev) => ({ ...prev, [k]: res.data.title })))
          .catch(() => setLabels((prev) => ({ ...prev, [k]: k })))
      );
  }, [value, sectorPublishers]);

  const search = useMemo(
    () =>
      debounce((query) => {
        if (!query) {
          setFound([]);
          return;
        }
        axiosNoAuth(`${config.gbifApi}organization?q=${encodeURIComponent(query)}&limit=20`)
          .then((res) => setFound((res.data?.results || []).map((o) => ({ value: o.key, label: o.title }))))
          .catch(() => setFound([]));
      }, 400),
    []
  );
  useEffect(() => () => search.cancel(), [search]);

  const query = q.toLowerCase();
  const suggested = query
    ? sectorPublishers.filter((o) => (o.label || "").toLowerCase().includes(query))
    : sectorPublishers;
  const byValue = new Map(
    [
      ...Object.entries(labels).map(([k, label]) => ({ value: k, label })),
      ...suggested,
      ...(query ? found : []),
    ].map((o) => [o.value, o])
  );

  return (
    <Select
      mode="multiple"
      style={{ width: "100%" }}
      allowClear
      placeholder="any publisher"
      value={value}
      onChange={onChange}
      showSearch={{
        filterOption: false,
        onSearch: (v) => {
          setQ(v);
          search(v);
        },
      }}
      options={[...byValue.values()]}
    />
  );
};

export default PublisherSelect;
