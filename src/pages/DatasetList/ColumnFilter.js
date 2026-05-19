import React from "react";

import { Select } from "antd";

class ColumnFilter extends React.Component {
  constructor(props) {
    super(props);
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

    this.handleHideColumnChange = this.handleHideColumnChange.bind(this);
    this.state = {
      excludeColumns: excludeColumns,
    };
  }

  handleHideColumnChange = (excludeColumns) => {
    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
    this.setState({ excludeColumns }, () => {
      this.props.onChange(excludeColumns);
    });
  };

  render = () => {
    const { excludeColumns } = this.state;
    const { columns } = this.props;
    return (
      <Select
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        defaultValue={excludeColumns}
        onChange={this.handleHideColumnChange}
        showSearch
        maxTagCount={4}
        options={columns.map((f) => ({ value: f.key, label: f.title }))}
      />
    );
  };
}

export default ColumnFilter;
