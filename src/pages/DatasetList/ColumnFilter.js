import React from "react";

import { Select } from "antd";
const Option = Select.Option;

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
      >
        {columns.map((f) => {
          return (
            <Option key={f.key} value={f.key}>
              {f.title}
            </Option>
          );
        })}
      </Select>
    );
  };
}

export default ColumnFilter;
