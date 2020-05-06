import React from "react";

import { Select, Form } from "antd";
import _ from "lodash";


const FormItem = Form.Item;

const Option = Select.Option;

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

class MultiValueFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: this.props.selected
    };
  }


  handleChange = selected => {
  
    this.setState({ selected }, () => {
      this.props.onChange(selected);
    });
  };

  render = () => {
    const {defaultValue, label, vocab} = this.props;
    return (
        <FormItem
       {...formItemLayout}
        label={label}
        style={{marginBottom: '8px'}}
      >
      <Select
        showSearch
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        value={defaultValue}
        onChange={this.handleChange}
      >
          {vocab.map((i) => {
                return (typeof i === 'string') ? <Option key={i} value={i}>{_.startCase(i)}</Option> : <Option key={i.value} value={i.value}>{i.label}</Option>
              })}
      </Select>
      </FormItem>
    );
  };
}

export default MultiValueFilter;
