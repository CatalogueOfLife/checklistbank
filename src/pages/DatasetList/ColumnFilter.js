import { useState } from "react";
import { Select } from "antd";

const getInitialExcludeColumns = () => {
  let excludeColumns = JSON.parse(
    localStorage.getItem("colplus_datasetlist_hide_columns")
  ) || [
    "creator",
    "version",
    "confidence",
    "editor",
    "geographicScope",
    "group",
    "private",
    "modified",
    "created",
    "completeness",
  ];
  // Handle metadata update
  if (excludeColumns.includes("organisations")) {
    excludeColumns = [
      "creator",
      "version",
      "confidence",
      "editor",
      "geographicScope",
      "group",
      "private",
      "modified",
      "created",
      "completeness",
    ];
  }
  // Add "group" (Taxonomic scope) to existing saved preferences if missing
  if (!excludeColumns.includes("group")) {
    excludeColumns = [...excludeColumns, "group"];
    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
  }
  return excludeColumns;
};

const ColumnFilter = ({ columns, onChange }) => {
  const [excludeColumns, setExcludeColumns] = useState(getInitialExcludeColumns);

  const handleHideColumnChange = (excludeColumns) => {
    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
    setExcludeColumns(excludeColumns);
    onChange(excludeColumns);
  };

  return (
    <Select
      style={{ width: "100%" }}
      mode="multiple"
      placeholder="Please select"
      defaultValue={excludeColumns}
      onChange={handleHideColumnChange}
      showSearch
      maxTagCount={4}
      options={columns.map((f) => ({ value: f.key, label: f.title }))}
    />
  );
};

export default ColumnFilter;
