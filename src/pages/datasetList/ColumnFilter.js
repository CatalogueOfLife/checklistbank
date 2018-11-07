import React from "react";

import { Select } from "antd";
import _ from "lodash";
const Option = Select.Option;

class ColumnFilter extends React.Component {
  constructor(props) {
    super(props);
    const excludeColumns =
      JSON.parse(localStorage.getItem("colplus_datasetlist_hide_columns")) ||
      [];

    this.handleHideColumnChange = this.handleHideColumnChange.bind(this);
    this.state = {
      excludeColumns: excludeColumns
    };
  }

  handleHideColumnChange = excludeColumns => {
    const { columns } = this.props;

    localStorage.setItem(
      "colplus_datasetlist_hide_columns",
      JSON.stringify(excludeColumns)
    );
    this.setState({ excludeColumns }, () => {
      this.props.onChange(
        _.filter(columns, v => !_.includes(excludeColumns, v.key))
      );
    });
  };

  render = () => {
    const { excludeColumns } = this.state;
    const { columns } = this.props;
    return (
      <Select
        style={{ width: "250px" }}
        mode="multiple"
        placeholder="Please select"
        defaultValue={excludeColumns}
        onChange={this.handleHideColumnChange}
      >
        {columns.map(f => {
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
