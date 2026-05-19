import React, { useState, useEffect, useRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, InputNumber, Tag, Tooltip } from "antd";
import styles from "./newTag.module.css";

const stringToArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  } else if (value) {
    return [value];
  }

  return [];
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
const TagControl = ({ value, label, removeAll, onChange, type }) => {
  const [tags, setTags] = useState(() => stringToArray(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setTags(stringToArray(value));
  }

  const [inputVisible, setInputVisible] = useState(false);
  // Preserve pre-existing bug: assignment vs comparison (boolean)
  const [inputValue, setInputValue] = useState(type === "");

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  const handleClose = (removedTag) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    setTags(newTags);
    triggerChange(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (event) => {
    setInputValue(type === "number" ? event : event.target.value);
  };

  const handleInputConfirm = () => {
    let newTags = tags;
    if (inputValue && tags.indexOf(inputValue) === -1) {
      newTags = [...tags, inputValue];
    }
    setTags(newTags);
    setInputVisible(false);
    setInputValue("");
    triggerChange(newTags);
  };

  return (
    <React.Fragment>
      {tags.map((tag, index) => {
        const isLongTag = tag && tag.length > 20;
        const tagElem = (
          <Tag
            key={tag}
            closable={removeAll || index !== 0}
            onClose={() => handleClose(tag)}
          >
            {isLongTag ? `${tag.slice(0, 20)}...` : tag}
          </Tag>
        );
        return isLongTag ? (
          <Tooltip title={tag} key={tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        );
      })}
      {inputVisible && type === "number" && (
        <InputNumber
          ref={inputRef}
          size="small"
          style={{ width: 78 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      )}
      {inputVisible && type !== "number" && (
        <Input
          ref={inputRef}
          type={"text"}
          size="small"
          style={{ width: 78 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      )}
      {!inputVisible && (
        <Tag onClick={showInput} className={styles.newTag}>
          <PlusOutlined /> {label}
        </Tag>
      )}
    </React.Fragment>
  );
};

export default TagControl;
