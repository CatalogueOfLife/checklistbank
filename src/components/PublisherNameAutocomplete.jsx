import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import { publisherOptionLabel } from "./publisherOption";

const axiosNoAuth = axios.create({ headers: { Authorization: null } });

// Suggests existing dataset publishers from the CLB API and applies the chosen
// name as an exact (case-insensitive) dataset-search filter. Distinct from the
// GBIF-org based PublisherAutocomplete.jsx.
const PublisherNameAutocomplete = ({
  defaultValue,
  onSelectPublisher,
  onResetSearch,
  onError,
  style,
  autoFocus,
  disabled,
  placeHolder,
}) => {
  const [publishers, setPublishers] = useState([]);
  const [value, setValue] = useState(defaultValue || "");
  const getPublishersRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      axiosNoAuth(
        `${config.dataApi}dataset/publishers?q=${encodeURIComponent(q)}&limit=25`
      )
        .then((res) => setPublishers(res.data || []))
        .catch((err) => {
          if (typeof onError === "function") onError(err);
          setPublishers([]);
        });
    }, 400);
    getPublishersRef.current = fn;
    return () => fn.cancel();
  }, []);

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  const handleSearch = (q) => {
    if (getPublishersRef.current) getPublishersRef.current(q);
  };

  const handleSelect = (val) => {
    setValue(val);
    if (typeof onSelectPublisher === "function") onSelectPublisher(val);
  };

  const onReset = () => {
    setValue("");
    setPublishers([]);
    if (typeof onResetSearch === "function") onResetSearch();
  };

  const suffix = value ? (
    <CloseCircleOutlined
      key="suffix"
      onClick={onReset}
      style={{ marginRight: "6px" }}
    />
  ) : (
    <span />
  );

  const options = (publishers || []).map((o) => ({
    key: o.key,
    value: o.key,
    label: (
      <Highlighter
        highlightStyle={{ fontWeight: "bold", padding: 0 }}
        searchWords={(value || "").split(" ")}
        autoEscape
        textToHighlight={publisherOptionLabel(o)}
      />
    ),
  }));

  return (
    <AutoComplete
      onSelect={handleSelect}
      onSearch={handleSearch}
      options={options}
      placeholder={placeHolder || "Filter by publisher"}
      style={style ? style : { width: "100%" }}
      onChange={(v) => setValue(v)}
      value={value}
      autoFocus={autoFocus === false ? false : true}
      disabled={disabled}
    >
      <Input.Search suffix={suffix} />
    </AutoComplete>
  );
};

export default PublisherNameAutocomplete;
