import { useState, useEffect } from "react";
import { Select } from "antd";

const ColumnFilter = ({ columns, onChange }) => {
  const [showColumns, setShowColumns] = useState([]);

  const setColumnsFromProps = (cols) => {
    let excludeColumns = JSON.parse(
      localStorage.getItem("colplus_datasetlist_hide_columns")
    ) || [
      "creator",
      "version",
      "confidence",
      "editor",
      "geographicScope",
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
        "private",
        "modified",
        "created",
        "completeness",
      ];
    }

    setShowColumns(
      cols.filter((c) => !excludeColumns.includes(c.key)).map((c) => c.key)
    );
  };

  useEffect(() => {
    setColumnsFromProps(columns);
  }, []);

  useEffect(() => {
    if (!columns || columns.length === 0) return;
    setColumnsFromProps(columns);
  }, [columns]);

  const handleHideColumnChange = (newShowColumns) => {
    const excludeColumns = columns
      .filter((c) => !newShowColumns.includes(c.key))
      .map((c) => c.key);
    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
    setShowColumns(newShowColumns);
    onChange(excludeColumns);
  };

  return (
    <Select
      style={{ width: "100%" }}
      mode="multiple"
      placeholder="Please select"
      value={showColumns}
      onChange={handleHideColumnChange}
      showSearch
      maxTagCount={4}
      options={columns.map((f) => ({ value: f.key, label: f.title }))}
    />
  );
};

export default ColumnFilter;
