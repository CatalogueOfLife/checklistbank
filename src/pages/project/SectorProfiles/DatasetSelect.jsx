import React, { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import config from "../../../config";
import { getDatasetsBatch } from "../../../api/dataset";

const labelOf = (d, key) => (d ? `${d.alias || d.title} [${d.key}]` : String(key));

// Multiple source datasets: searches the sources of the project, merged ones included
const DatasetSelect = ({ value = [], onChange, datasetKey }) => {
  const [labels, setLabels] = useState({});
  const [found, setFound] = useState([]);

  useEffect(() => {
    const missing = (value || []).filter((k) => !(k in labels));
    if (missing.length) {
      getDatasetsBatch(missing).then((list) =>
        setLabels((prev) => ({
          ...prev,
          ...Object.fromEntries(missing.map((k, i) => [k, labelOf(list[i], k)])),
        }))
      );
    }
  }, [value]);

  const search = useMemo(
    () =>
      debounce((q) => {
        if (!q) {
          setFound([]);
          return;
        }
        axios(`${config.dataApi}dataset/${datasetKey}/source/suggest?merge=true&q=${encodeURIComponent(q)}`)
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : res.data?.result || [];
            setFound(list.map((d) => ({ value: d.key, label: labelOf(d, d.key) })));
          })
          .catch(() => setFound([]));
      }, 400),
    [datasetKey]
  );
  useEffect(() => () => search.cancel(), [search]);

  const byValue = new Map(
    [...Object.entries(labels).map(([k, label]) => ({ value: Number(k), label })), ...found].map((o) => [o.value, o])
  );

  return (
    <Select
      mode="multiple"
      style={{ width: "100%" }}
      allowClear
      placeholder="any source dataset"
      value={value}
      onChange={onChange}
      showSearch={{ filterOption: false, onSearch: search }}
      options={[...byValue.values()]}
    />
  );
};

export default DatasetSelect;
