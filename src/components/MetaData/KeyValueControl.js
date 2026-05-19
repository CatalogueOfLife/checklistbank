import React, { useState, useEffect, useRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Tag, Tooltip } from "antd";
import styles from "../newTag.module.css";
import _ from "lodash";

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
const KeyValueControl = ({ value, label, removeAll, onChange, keyPlaceHolder, valuePlaceHolder }) => {
  const [tags, setTags] = useState(() => _.isObject(value) ? value : {});
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setTags(_.isObject(value) ? value : {});
  }

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputKey, setInputKey] = useState("");

  const inputRef = useRef(null);
  const inputKeyRef = useRef(null);

  useEffect(() => {
    if (inputVisible) {
      inputKeyRef.current?.focus();
    }
  }, [inputVisible]);

  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  const handleClose = (removedTag) => {
    const newTags = _.omit(tags, removedTag);
    setTags(newTags);
    triggerChange(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputValueChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyChange = (event) => {
    setInputKey(event.target.value);
  };

  const handleInputConfirm = () => {
    // Preserve pre-existing direct mutation behaviour
    if (inputKey && inputValue && !tags[inputKey]) {
      tags[inputKey] = inputValue;
    }
    setTags({ ...tags });
    setInputVisible(false);
    setInputKey("");
    setInputValue("");
    triggerChange(tags);
  };

  return (
    <React.Fragment>
      {Object.keys(tags).map((key, index) => {
        const isLongTag = tags[key] && tags[key].length > 20;
        const tagElem = (
          <Tag
            key={key}
            closable={true}
            onClose={() => handleClose(key)}
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
            ref={inputKeyRef}
            type="text"
            size="small"
            style={{ width: 40 }}
            value={inputKey}
            placeholder={keyPlaceHolder || "Key"}
            onChange={handleInputKeyChange}
          />
          <Input
            ref={inputRef}
            type="text"
            size="small"
            style={{ width: 78 }}
            value={inputValue}
            placeholder={valuePlaceHolder || "Value"}
            onChange={handleInputValueChange}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
          />
        </React.Fragment>
      )}
      {!inputVisible && (
        <Tag onClick={showInput} className={styles.newTag}>
          <PlusOutlined /> {label}
        </Tag>
      )}
    </React.Fragment>
  );
};

export default KeyValueControl;
