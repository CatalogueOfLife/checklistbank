import { useEffect, useMemo, useRef, useState } from "react";
import { Select, Form } from "antd";
import axios from "axios";
import _ from "lodash";
import config from "../../config";

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const datasetLabel = (ds) =>
  `${ds.title}${ds.alias ? ` (${ds.alias})` : ""} [${ds.key}]`;

// Dataset filter of the cross dataset search. The datasetKey facet only names
// the datasets with the most hits, and only once there is a query term, so
// typing also searches all datasets by key, alias or title. Selected datasets
// outside both lists are labelled through loadDataset, e.g. from a deep link.
const DatasetFilter = ({ value, facetOptions, onChange, loadDataset }) => {
  const selected = useMemo(
    () => [].concat(value ?? []).map(String),
    [value]
  );
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState({});
  const requestRef = useRef(0);

  const search = useMemo(
    () =>
      _.debounce((q) => {
        const request = ++requestRef.current;
        axios(
          `${config.dataApi}dataset?q=${encodeURIComponent(q)}&limit=20`
        )
          .then((res) => {
            if (request !== requestRef.current) return;
            setSuggestions(
              (res?.data?.result || []).map((ds) => ({
                value: String(ds.key),
                label: datasetLabel(ds),
              }))
            );
          })
          .catch(() => {
            if (request === requestRef.current) setSuggestions([]);
          })
          .finally(() => {
            if (request === requestRef.current) setLoading(false);
          });
      }, 300),
    []
  );
  useEffect(() => () => search.cancel(), [search]);

  const handleSearch = (q) => {
    if (q && q.trim()) {
      setLoading(true);
      search(q.trim());
    } else {
      search.cancel();
      requestRef.current++;
      setLoading(false);
      setSuggestions([]);
    }
  };

  // keep the names of what was picked from the suggestions, which are gone
  // once the text is cleared
  const handleChange = (keys) => {
    const picked = _.keyBy(suggestions, "value");
    setLabels((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        if (picked[k]) next[k] = picked[k].label;
      });
      return next;
    });
    handleSearch("");
    onChange(keys);
  };

  const facetKeys = useMemo(
    () => new Set((facetOptions || []).map((o) => String(o.value))),
    [facetOptions]
  );

  useEffect(() => {
    if (!loadDataset) return;
    const missing = selected.filter((k) => !facetKeys.has(k) && !labels[k]);
    if (missing.length === 0) return;
    Promise.all(missing.map((k) => loadDataset(k))).then((loaded) => {
      const found = loaded.filter(Boolean);
      if (found.length === 0) return;
      setLabels((prev) => ({
        ...prev,
        ...Object.fromEntries(found.map((ds) => [String(ds.key), datasetLabel(ds)])),
      }));
    });
  }, [selected, facetKeys, labels, loadDataset]);

  const options = _.uniqBy(
    [
      ...(facetOptions || []).map((o) => ({
        value: String(o.value),
        label: o.label,
      })),
      ...suggestions,
      ...selected.map((k) => ({ value: k, label: labels[k] || k })),
    ],
    "value"
  );

  // the facet values only match on their label, the dataset search already
  // matched key, alias and title
  const suggestionKeys = new Set(suggestions.map((o) => o.value));
  const filterOption = (input, option) =>
    suggestionKeys.has(option.value) ||
    String(option.label).toLowerCase().includes(input.trim().toLowerCase());

  return (
    <FormItem
      {...formItemLayout}
      label="Dataset"
      style={{ marginBottom: "8px" }}
    >
      <Select
        showSearch={{ filterOption, onSearch: handleSearch }}
        loading={loading}
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Dataset key, alias or title"
        value={selected}
        onChange={handleChange}
        onBlur={() => handleSearch("")}
        options={options}
      />
    </FormItem>
  );
};

export default DatasetFilter;
