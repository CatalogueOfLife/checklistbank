import React from "react";

import { Select, Form } from "antd";
import _ from "lodash";
import axios from 'axios'
import config from "../../config";

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
    this.handleChange = this.handleChange.bind(this);
    this.getEnumeration = this.getEnumeration.bind(this);
    this.state = {
      enumeration: [],  
      selected: this.props.selected
    };
  }

  componentWillMount = () => {
      this.getEnumeration()
  }
  getEnumeration = () => {
    const {vocab} = this.props;
    axios(`${config.dataApi}vocab/${vocab}`)
      .then((res) => {

        this.setState({ enumeration: res.data, error: null })
      })
      .catch((err) => {
        this.setState({ enumeration: [], error: err })
      })

  }
  handleChange = selected => {
  
    this.setState({ selected }, () => {
      this.props.onChange(selected);
    });
  };

  render = () => {
    const { enumeration } = this.state;
    const {defaultValue, label} = this.props;
    return (
        <FormItem
       {...formItemLayout}
        label={label}
      >
      <Select
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="Please select"
        value={defaultValue}
        onChange={this.handleChange}
      >
          {enumeration.map((i) => {
                return <Option key={i} value={i}>{_.startCase(i)}</Option>
              })}
      </Select>
      </FormItem>
    );
  };
}

export default MultiValueFilter;
