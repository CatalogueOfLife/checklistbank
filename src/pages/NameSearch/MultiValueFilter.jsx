import { Select, Form } from "antd";
import _ from "lodash";

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const MultiValueFilter = ({
  selected,
  defaultValue,
  label,
  vocab,
  onChange,
  disabled,
}) => {
  const handleChange = (selected) => {
    onChange(selected);
  };

  return (
    <FormItem
      {...formItemLayout}
      label={label}
      style={{ marginBottom: "8px" }}
    >
      <Select
        showSearch
        disabled={disabled}
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        value={defaultValue}
        onChange={handleChange}
        options={(vocab || []).map((i) =>
          typeof i === "string"
            ? { value: i, label: _.startCase(i) }
            : { value: i.value, label: i.label }
        )}
      />
    </FormItem>
  );
};

export default MultiValueFilter;
