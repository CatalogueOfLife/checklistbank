import React from "react";
import { Tag, Popover } from "antd";

// User key of the backend agent that runs the homotypic grouping algorithm
export const HOMOTYPIC_GROUPER_USER_KEY = 14;

export const isCreatedByHomotypicGrouper = (obj) =>
  obj?.createdBy === HOMOTYPIC_GROUPER_USER_KEY;

const description = (
  <div style={{ maxWidth: "420px" }}>
    <p>
      This relation was inferred by the <strong>homotypic grouping</strong>{" "}
      algorithm, which runs over every family when an extended release (XR) is
      built. It was not asserted by a source dataset, even if both names
      already existed in one.
    </p>
    <p>
      All species-group names of a family are grouped by their normalised
      terminal epithet, tolerating gender endings and minor spelling
      variants. Within each epithet the authorships are compared: a
      combination whose bracketed author matches the author of an original
      name is treated as a recombination of that basionym. From each group
      the algorithm creates <em>basionym</em>, <em>homotypic</em>,{" "}
      <em>based on</em> and <em>spelling correction</em> relations, and keeps
      only one accepted name per group.
    </p>
    <p style={{ marginBottom: 0 }}>
      The grouping relies on names and authorship alone. Where an author
      published the same epithet in several genera of one family, the
      grouping can be wrong. Groups that could not be resolved are flagged
      with the issue <em>homotypic consolidation unresolved</em>.
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
