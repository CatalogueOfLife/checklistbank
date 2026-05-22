import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import { truncate } from "../../../components/util";

const DatasetAutocomplete = ({
  defaultDatasetKey,
  onSelectDataset,
  onResetSearch,
  onError,
  contributesTo,
  origin,
  minSize,
  merge = true,
  style,
  autoFocus,
  placeHolder,
}) => {
  const [datasets, setDatasets] = useState([]);
  const [value, setValue] = useState("");
  const getDatasetsRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      const url = !!contributesTo
        ? `${
            config.dataApi
          }dataset/${contributesTo}/source/suggest?merge=${merge}&q=${encodeURIComponent(
            q
          )}`
        : `${config.dataApi}dataset?q=${encodeURIComponent(q)}&limit=30${
            origin ? "&origin=" + origin : ""
          }${minSize ? "&minSize=" + minSize : ""}`;
      axios(url)
        .then((res) => {
          setDatasets(
            _.isArray(res?.data?.result)
              ? res?.data?.result
              : _.isArray(res?.data)
              ? res.data
              : []
          );
        })
        .catch((err) => {
          if (typeof onError === "function") {
            onError(err);
          }
          setDatasets([]);
        });
    }, 500);
    getDatasetsRef.current = fn;
    return () => fn.cancel();
  }, [contributesTo, origin, minSize, merge]);

  const setDefaultValue = (key) => {
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        let o = res.data;
        setValue(
          `${o.alias || truncate(o.title, 25)} ${o.version || ""} [${o.key}]`
        );
        onSelectDataset(res.data);
      })
      .catch((error) => {
        if (typeof onError === "function") {
          onError(error);
        }
      });
  };

  useEffect(() => {
    if (defaultDatasetKey) {
      setDefaultValue(defaultDatasetKey);
    }
  }, []);

  useEffect(() => {
    if (defaultDatasetKey) {
      setDefaultValue(defaultDatasetKey);
    } else if (!defaultDatasetKey) {
      setValue("");
    }
  }, [defaultDatasetKey]);

  const handleSearch = (q) => {
    if (getDatasetsRef.current) getDatasetsRef.current(q);
  };

  const handleSelect = (val, obj) => {
    setValue(val);
    console.log(obj?.data);
    onSelectDataset({ key: obj.key, title: val, data: obj?.data });
  };

  const onReset = () => {
    setValue("");
    setDatasets([]);
    if (onResetSearch && typeof onResetSearch === "function") {
      onResetSearch();
    }
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

  const options = datasets
    ? datasets.map((o) => {
        const text = `${o.alias || truncate(o.title, 25)} ${
          o.version || ""
        } [${o.key}]`;
        return {
          key: o.key,
          value: text,
          label: (
            <Highlighter
              highlightStyle={{ fontWeight: "bold", padding: 0 }}
              searchWords={value.split(" ")}
              autoEscape
              textToHighlight={text}
            />
          ),
          data: o,
        };
      })
    : [];

  return (
    <AutoComplete
      onSelect={handleSelect}
      onSearch={handleSearch}
      options={options}
      placeholder={placeHolder || "Find dataset"}
      style={style ? style : { width: "100%" }}
      onChange={(v) => setValue(v)}
      value={value}
      autoFocus={autoFocus === false ? false : true}
    >
      <Input.Search suffix={suffix} />
    </AutoComplete>
  );
};

export default DatasetAutocomplete;
