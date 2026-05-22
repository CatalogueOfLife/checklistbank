import React from "react";

const ShowMoreToggle = ({ total, visible, showAll, onChange }) => {
  if (total <= visible && !showAll) return null;
  return (
    <a onClick={() => onChange(!showAll)} style={{ cursor: "pointer" }}>
      {showAll ? "Show less" : `Show all (${total})`}
    </a>
  );
};

export default ShowMoreToggle;
