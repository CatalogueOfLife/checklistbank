import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";

const UserAutocomplete = ({ defaultUserName, onSelectUser, onResetSearch, placeHolder, style, autoFocus }) => {
  const [users, setUsers] = useState([]);
  const [value, setValue] = useState("");
  const getUsersRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      axios(`${config.dataApi}user?q=${encodeURIComponent(q)}&limit=30`)
        .then((res) => {
          setUsers(res.data.result);
        })
        .catch(() => {
          setUsers([]);
        });
    }, 500);
    getUsersRef.current = fn;
    return () => fn.cancel();
  }, []);

  const setDefaultValue = (name) => {
    axios(`${config.dataApi}user/${name}`).then((res) => {
      setValue(_.get(res, "data.title") || "");
      onSelectUser(res.data);
    });
  };

  useEffect(() => {
    if (defaultUserName) {
      setDefaultValue(defaultUserName);
    }
  }, []);

  useEffect(() => {
    if (defaultUserName) {
      setDefaultValue(defaultUserName);
    } else if (!defaultUserName) {
      setValue("");
    }
  }, [defaultUserName]);

  const handleSearch = (q) => {
    if (getUsersRef.current) getUsersRef.current(q);
  };

  const handleSelect = (val, obj) => {
    setValue(val);
    onSelectUser({ key: obj.key, title: val });
  };

  const onReset = () => {
    setValue("");
    setUsers([]);
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

  const options = users
    ? users.map((o) => {
        const text =
          !o.firstname && !o.lastname
            ? o.username
            : `${o.firstname} ${o.lastname} (${o.username})`;
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
      placeholder={placeHolder || "Find user"}
      style={style ? style : { width: "100%" }}
      onChange={(v) => setValue(v)}
      value={value}
      autoFocus={autoFocus === false ? false : true}
    >
      <Input.Search suffix={suffix} />
    </AutoComplete>
  );
};

export default UserAutocomplete;
