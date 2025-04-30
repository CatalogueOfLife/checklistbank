import React from "react";
import { Tag, Popover } from "antd";

const DecisionBadge = ({ style = {}, decision }) => (
  <Popover
    content={
      <pre
        style={{ fontSize: "10px", fontFamily: "monospace", width: "400px" }}
      >
        {JSON.stringify(decision, null, 2)}
      </pre>
    }
    placement="top"
    trigger="click"
  >
    <Tag
      color="gold"
      style={{
        cursor: "pointer",
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
      DC
    </Tag>
  </Popover>
);

export default DecisionBadge;
