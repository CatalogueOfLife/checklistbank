import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { debounce } from "lodash";

const ReferenceAutocomplete = ({ datasetKey, onSelectReference, onResetSearch }) => {
  const [references, setReferences] = useState([]);
  const [value, setValue] = useState("");
  const getReferencesRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      axios(`${config.dataApi}dataset/${datasetKey}/reference?q=${q}&limit=30`)
        .then((res) => {
          setReferences(res.data.result);
        })
        .catch(() => {
          setReferences([]);
        });
    }, 500);
    getReferencesRef.current = fn;
    return () => fn.cancel();
  }, [datasetKey]);

  const handleSearch = (q) => {
    if (getReferencesRef.current) getReferencesRef.current(q);
  };

  const handleSelect = (val, obj) => {
    setValue(val);
    onSelectReference({ key: val, title: obj.props.children });
  };

  const onReset = () => {
    setValue("");
    setReferences([]);
    onResetSearch();
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

  return (
    <AutoComplete
      onSelect={handleSelect}
      onSearch={handleSearch}
      dataSource={
        references
          ? references.map((o) => ({
              value: o.id,
              text: o.citation,
            }))
          : []
      }
      placeholder="Find reference"
      style={{ width: "100%" }}
      onChange={(v) => setValue(v)}
      value={value}
    >
      <Input.Search suffix={suffix} />
    </AutoComplete>
  );
};

export default ReferenceAutocomplete;
