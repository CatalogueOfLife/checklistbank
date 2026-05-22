import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import { truncate } from "./util";

const axiosNoAuth = axios.create({ headers: { Authorization: null } });

const PublisherAutocomplete = ({
  defaultPublisherKey,
  onSelectPublisher,
  onResetSearch,
  onError,
  style,
  autoFocus,
  disabled,
  placeHolder,
}) => {
  const [publishers, setPublishers] = useState([]);
  const [value, setValue] = useState("");
  const getPublishersRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      axiosNoAuth(
        `${config.gbifApi}organization?q=${encodeURIComponent(q)}&limit=30`
      )
        .then((res) => {
          setPublishers(res.data.results);
        })
        .catch((err) => {
          if (typeof onError === "function") {
            onError(err);
          }
          setPublishers([]);
        });
    }, 500);
    getPublishersRef.current = fn;
    return () => fn.cancel();
  }, []);

  const setDefaultValue = (key) => {
    axiosNoAuth(`${config.gbifApi}organization/${key}`)
      .then((res) => {
        let o = res.data;
        setValue(
          `${o.alias || truncate(o.title, 25)} ${o.version || ""} [${o.key}]`
        );
        onSelectPublisher(res.data);
      })
      .catch((error) => {
        if (typeof onError === "function") {
          onError(error);
        }
      });
  };

  useEffect(() => {
    if (defaultPublisherKey) {
      setDefaultValue(defaultPublisherKey);
    }
  }, []);

  useEffect(() => {
    if (defaultPublisherKey) {
      setDefaultValue(defaultPublisherKey);
    } else if (!defaultPublisherKey) {
      setValue("");
    }
  }, [defaultPublisherKey]);

  const handleSearch = (q) => {
    if (getPublishersRef.current) getPublishersRef.current(q);
  };

  const handleSelect = (val, obj) => {
    setValue(val);
    onSelectPublisher({ key: obj.key, title: obj.title });
  };

  const onReset = () => {
    setValue("");
    setPublishers([]);
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

  const options = publishers
    ? publishers.map((o) => {
        const text = `${o.alias || truncate(o.title, 25)} ${
          o.version || ""
        } [${o.key}]`;
        return {
          key: o.key,
          title: o.title,
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
      placeholder={placeHolder || "Find publisher"}
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

export default PublisherAutocomplete;
