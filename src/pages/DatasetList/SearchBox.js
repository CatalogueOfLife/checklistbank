import { useEffect, useState } from "react";
import { CloseCircleOutlined } from "@ant-design/icons";
import { Input } from "antd";
const Search = Input.Search;

const SearchBox = ({ defaultValue, onSearch }) => {
  const [search, setSearch] = useState(defaultValue || "");

  useEffect(() => {
    if (defaultValue) setSearch(defaultValue);
  }, [defaultValue]);

  const resetSearch = () => {
    setSearch("");
    onSearch("");
  };

  const suffix = search ? (
    <CloseCircleOutlined
      key="suffix"
      style={{ marginRight: "6px" }}
      onClick={resetSearch}
    />
  ) : (
    <span />
  );

  return (
    <Search
      placeholder="Search"
      value={search}
      onSearch={() => onSearch(search)}
      onChange={(event) => setSearch(event.target.value)}
      autoFocus={true}
      suffix={suffix}
    />
  );
};

export default SearchBox;
