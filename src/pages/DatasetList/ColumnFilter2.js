import React from "react";

import { Select } from "antd";
const Option = Select.Option;

class ColumnFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showColumns: [],
    };
  }

  componentDidMount = () => {
    this.setColumns(this.props.columns);
  };

  componentDidUpdate = (nextProps) => {
    if (!this.props.columns || this.props.columns.length === 0) {
      this.setColumns(nextProps.columns);
    }
  };
  setColumns = (columns) => {
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

    this.setState({
      showColumns: columns
        .filter((c) => !excludeColumns.includes(c.key))
        .map((c) => c.key),
    });
  };

  handleHideColumnChange = (showColumns) => {
    const { columns } = this.props;
    const excludeColumns = columns
      .filter((c) => !showColumns.includes(c.key))
      .map((c) => c.key);
    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
    this.setState({ showColumns }, () => {
      this.props.onChange(excludeColumns);
    });
  };

  render = () => {
    const { showColumns } = this.state;
    const { columns } = this.props;
    return (
      <Select
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        value={showColumns}
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
