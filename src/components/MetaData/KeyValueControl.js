import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Tag, Tooltip } from "antd";
import injectSheet from "react-jss";
import _ from "lodash";

const stringToArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  } else if (value) {
    return [value];
  }

  return [];
};

const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
  },
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
class KeyValueControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ("value" in nextProps) {
      // let value = stringToArray(nextProps.value);

      return { tags: _.isObject(nextProps.value) ? nextProps.value : {} };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      tags: _.isObject(props.value) ? props.value : {},
      inputVisible: false,
      inputValue: "",
      inputKey: "",
    };
  }

  handleClose = (removedTag) => {
    let tags = _.omit(this.state.tags, removedTag);

    this.setState({ tags });
    this.triggerChange(tags);
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.inputKey.focus());
  };

  handleInputValueChange = (event) => {
    this.setState({ inputValue: event.target.value });
  };
  handleInputKeyChange = (event) => {
    this.setState({ inputKey: event.target.value });
  };
  handleInputConfirm = () => {
    const { inputKey, inputValue, tags } = this.state;
    if (inputKey && inputValue && !tags[inputKey]) {
      tags[inputKey] = inputValue;
    }

    this.setState({
      tags: { ...tags },
      inputVisible: false,
      inputKey: "",
      inputValue: "",
    });
    this.triggerChange(tags);
  };

  triggerChange = (changedValue) => {
    // Should provide an event to pass value to Form
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(changedValue);
    }
  };

  saveInputRef = (input) => (this.input = input);
  saveInputKeyRef = (input) => (this.inputKey = input);

  render() {
    const { tags, inputVisible, inputValue, inputKey } = this.state;
    const { classes, label, removeAll } = this.props;

    return (
      <React.Fragment>
        {Object.keys(tags).map((key, index) => {
          const isLongTag = tags[key] && tags[key].length > 20;
          const tagElem = (
            <Tag
              key={key}
              closable={true}
              onClose={() => this.handleClose(key)}
            >
              <strong>{key}: </strong>
              {isLongTag ? `${tags[key].slice(0, 20)}...` : `${tags[key]}`}
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={tags[key]} key={tags[key]}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
        {inputVisible && (
          <React.Fragment>
            <Input
              ref={this.saveInputKeyRef}
              type="text"
              size="small"
              style={{ width: 40 }}
              value={inputKey}
              placeholder={this.props.keyPlaceHolder || "Key"}
              onChange={this.handleInputKeyChange}
            />
            <Input
              ref={this.saveInputRef}
              type="text"
              size="small"
              style={{ width: 78 }}
              value={inputValue}
              placeholder={this.props.valuePlaceHolder || "Value"}
              onChange={this.handleInputValueChange}
              onBlur={this.handleInputConfirm}
              onPressEnter={this.handleInputConfirm}
            />
          </React.Fragment>
        )}
        {!inputVisible && (
          <Tag onClick={this.showInput} className={classes.newTag}>
            <PlusOutlined /> {label}
          </Tag>
        )}
      </React.Fragment>
    );
  }
}

KeyValueControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool, // optional flag, to allow remove all tags or not
};

export default injectSheet(styles)(KeyValueControl);
