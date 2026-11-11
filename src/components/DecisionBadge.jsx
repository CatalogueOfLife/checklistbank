import React from "react";
import { Tag, Popover } from "antd";

const DecisionBadge = ({ style = {}, decision }) => {
  // shown without the bookkeeping fields; a copy, as callers keep the decision
  const {
    subject,
    originalSubjectId,
    subjectDatasetKey,
    datasetKey,
    created,
    createdBy,
    modified,
    modifiedBy,
    ...rest
  } = decision;
  // Block and ignore decisions remove the record, so the badge mostly marks
  // update decisions; reviewed ones can show too, hence the mode in the title.
  const title = decision?.mode
    ? `Editorial ${decision.mode} decision`
    : "Editorial decision";
  return (
    <Popover
      title={title}
      content={
        <pre
          style={{ fontSize: "10px", fontFamily: "monospace", width: "400px" }}
        >
          {JSON.stringify(rest, null, 2)}
        </pre>
      }
      placement="top"
      trigger="click"
    >
      <Tag
        color="gold"
        title={title}
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
        ED
      </Tag>
    </Popover>
  );
};

export default DecisionBadge;
