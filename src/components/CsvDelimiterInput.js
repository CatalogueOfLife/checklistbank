import React from "react";

import { Input } from "antd";

class CsvDelimiterInput extends React.Component {
  handleDelimiterChange = (e) => {
    this.triggerChange(e.target.value);
  };

  triggerChange = (changedValue) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(changedValue);
    }
  };

  render() {
    const { value } = this.props;
    return (
      <Input
        type="text"
        value={value === "\t" ? "<TAB>" : value}
        onChange={this.handleDelimiterChange}
        onKeyDown={(e) => {
          if (e.nativeEvent.keyCode === 9) {
            e.nativeEvent.preventDefault();
            this.triggerChange("\t");
          } else if (e.nativeEvent.keyCode === 8 && value === "\t") {
            e.nativeEvent.preventDefault();
            this.triggerChange("");
          }
        }}
      />
    );
  }
}

export default CsvDelimiterInput;
