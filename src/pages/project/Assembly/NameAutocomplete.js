import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";

const NameSearchAutocomplete = ({
  defaultTaxonKey,
  datasetKey,
  minRank,
  accepted,
  onSelectName,
  onResetSearch,
  onError,
  placeHolder,
  autoFocus,
  disabled = false,
}) => {
  const [names, setNames] = useState([]);
  const [value, setValue] = useState("");
  const [notFoundText, setNotFoundText] = useState(null);
  const getNamesRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      if (!q) return;
      const url = datasetKey
        ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
        : `${config.dataApi}name/search`;

      axios(
        `${url}?limit=25&q=${encodeURIComponent(q)}${
          minRank ? `&minRank=${minRank}` : ""
        }${accepted ? "&accepted=true" : ""}`
      )
        .then((res) => {
          setNames(res.data || []);
        })
        .catch((err) => {
          setNames([]);
          if (onError && typeof onError === "function") {
            onError(err);
          }
        });
    }, 500);
    getNamesRef.current = fn;
    return () => fn.cancel();
  }, [datasetKey, minRank, accepted]);

  const setDefaultValue = (usageId) => {
    axios(
      `${config.dataApi}nameusage/search?USAGE_ID=${encodeURIComponent(
        usageId
      )}&DATASET_KEY=${datasetKey}`
    )
      .then((res) => {
        let val = _.get(res, "data.result[0].usage.label");
        if (val) {
          setValue(val);
        } else {
          setNotFoundText(`Not found: ${usageId}`);
        }
      })
      .catch((err) => {
        setValue("");
        if (onError && typeof onError === "function") {
          onError(err);
        }
      });
  };

  useEffect(() => {
    if (defaultTaxonKey) {
      setDefaultValue(defaultTaxonKey);
    }
  }, []);

  useEffect(() => {
    if (defaultTaxonKey) {
      setDefaultValue(defaultTaxonKey);
    }
  }, [defaultTaxonKey]);

  const handleSearch = (q) => {
    if (getNamesRef.current) getNamesRef.current(q);
  };

  const handleSelect = (val, obj) => {
    const selectedTaxon = _.get(obj, "data.acceptedUsageId")
      ? {
          key: _.get(obj, "data.acceptedUsageId"),
          title: _.get(obj, "data.parentOrAcceptedName"),
        }
      : { key: _.get(obj, "data.usageId"), title: _.get(obj, "data.match") };
    setValue(val);
    onSelectName(selectedTaxon);
  };

  const onReset = () => {
    setValue("");
    setNames([]);
    if (typeof onResetSearch === "function") {
      onResetSearch();
    }
  };

  const options = names.map((o) => ({
    key: o.usageId,
    value: o.suggestion,
    label: (
      <Highlighter
        highlightStyle={{ fontWeight: "bold", padding: 0 }}
        searchWords={value.split(" ")}
        autoEscape
        textToHighlight={o.suggestion}
      />
    ),
    data: o,
  }));

  const suffix =
    !disabled && value ? (
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
      options={options}
      style={{ width: "100%" }}
      onSelect={handleSelect}
      onSearch={handleSearch}
      placeholder={!value && notFoundText ? notFoundText : placeHolder || "Find taxon"}
      onChange={(v) => {
        setValue(v);
        setNotFoundText(null);
      }}
      value={value}
      autoFocus={autoFocus === false ? false : true}
      disabled={disabled}
    >
      <Input.Search status={!value && notFoundText ? "error" : null} suffix={suffix} />
    </AutoComplete>
  );
};

export default NameSearchAutocomplete;
