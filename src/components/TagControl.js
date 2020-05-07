import React from 'react';
import PropTypes from 'prop-types';
import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip } from 'antd';
import injectSheet from 'react-jss';

const stringToArray = value => {
    if (Array.isArray(value)) {
      return value;
    } else if (value) {
      return [value];
    }
  
    return [];
  };

const styles = {
  newTag: {
    background: '#fff',
    borderStyle: 'dashed'
  }
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
class TagControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ('value' in nextProps) {
      let value = stringToArray(nextProps.value);

      return { tags: value };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      tags: stringToArray(props.value),
      inputVisible: false,
      inputValue: ''
    };
  }

  handleClose = removedTag => {
    const tags = this.state.tags.filter(tag => tag !== removedTag);

    this.setState({ tags });
    this.triggerChange(tags);
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input.focus());
  };

  handleInputChange = event => {
    this.setState({ inputValue: event.target.value });
  };

  handleInputConfirm = () => {
    const state = this.state;
    const inputValue = state.inputValue;
    let tags = state.tags;
    if (inputValue && tags.indexOf(inputValue) === -1) {
      tags = [...tags, inputValue];
    }

    this.setState({
      tags,
      inputVisible: false,
      inputValue: ''
    });
    this.triggerChange(tags);
  };

  triggerChange = changedValue => {
    // Should provide an event to pass value to Form
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(changedValue);
    }
  };

  saveInputRef = input => this.input = input;

  render() {
    const { tags, inputVisible, inputValue } = this.state;
    const { classes, label, removeAll } = this.props;

    return (
      <React.Fragment>
        {tags.map((tag, index) => {
          const isLongTag = tag && tag.length > 20;
          const tagElem = (
            <Tag key={tag} closable={removeAll || index !== 0} afterClose={() => this.handleClose(tag)}>
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </Tag>
          );
          return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
        })}
        {inputVisible && (
          <Input
            ref={this.saveInputRef}
            type="text"
            size="small"
            style={{ width: 78 }}
            value={inputValue}
            onChange={this.handleInputChange}
            onBlur={this.handleInputConfirm}
            onPressEnter={this.handleInputConfirm}
          />
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

TagControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool // optional flag, to allow remove all tags or not
};

export default injectSheet(styles)(TagControl);