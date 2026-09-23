import React from "react";
import { Tag, Popover } from "antd";

// User key of the backend agent that runs the homotypic grouping algorithm
export const HOMOTYPIC_GROUPER_USER_KEY = 14;

export const isCreatedByHomotypicGrouper = (obj) =>
  obj?.createdBy === HOMOTYPIC_GROUPER_USER_KEY;

const description = (
  <div style={{ maxWidth: "400px" }}>
    <p>
      This relation was created automatically by the{" "}
      <strong>homotypic grouping</strong> algorithm, which is standardly run
      when building extended releases (XR).
    </p>
    <p>
      Within a family, names are compared by their terminal epithet (ignoring
      gender changes of the ending) and their authorship. A name whose
      authorship appears in parentheses as the basionym author of another name
      with the same epithet is considered its basionym, and the names are
      grouped as homotypic.
    </p>
    <p style={{ marginBottom: 0 }}>
      The relation is therefore inferred and not asserted by any source
      dataset.
    </p>
  </div>
);

const HomotypicGroupingBadge = ({ style = {}, popoverPlacement }) => (
  <Popover
    title="Homotypic grouping"
    content={description}
    trigger="click"
    placement={popoverPlacement || "right"}
  >
    <Tag
      color="geekblue"
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
      HG
    </Tag>
  </Popover>
);

export default HomotypicGroupingBadge;
