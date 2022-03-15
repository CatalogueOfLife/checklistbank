import React from "react";
import { Badge } from "antd";
import { FormattedMessage } from "react-intl";

/**
 * Widget for boolean value representation with color indicator and Yes/No text transcription
 * @param value
 * @returns {*}
 * @constructor
 */
const BooleanValue = ({ value }) =>
  value === false || value === true ? (
    <Badge
      status={value ? "success" : "error"}
      text={
        value ? "Yes" : "No" 
      }
    />
  ) : null;

export default BooleanValue;
