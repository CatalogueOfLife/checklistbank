import { Input } from "antd";

const CsvDelimiterInput = ({ value, onChange }) => {
  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  return (
    <Input
      type="text"
      value={value === "\t" ? "<TAB>" : value}
      onChange={(e) => triggerChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.keyCode === 9) {
          e.nativeEvent.preventDefault();
          triggerChange("\t");
        } else if (e.nativeEvent.keyCode === 8 && value === "\t") {
          e.nativeEvent.preventDefault();
          triggerChange("");
        }
      }}
    />
  );
};

export default CsvDelimiterInput;
