import React from "react";
import { Tag } from "antd";

const MergedDataBadge = ({ style = {} }) => (
  <Tag
    color="purple"
    style={{
      fontFamily: "monospace",
      fontSize: "8px",
      fontWeight: 900,
      padding: "2px",
      lineHeight: "8px",
      verticalAlign: "middle",
      marginRight: "2px",
      ...style,
    }}
  >
    XR
  </Tag>
);

export default MergedDataBadge;
