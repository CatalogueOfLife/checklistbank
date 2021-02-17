import React from "react";

export default ({ organisation, style }) => (
  <span style={style}>
    <span style={{ display: "block" }}>{organisation.name}</span>
    {organisation.department && (
      <span style={{ display: "block" }}>{organisation.department}</span>
    )}
    {(organisation.city || organisation.state || organisation.country) && (
      <span style={{ display: "block" }}>
        {[organisation.city, organisation.state, organisation.country]
          .filter((a) => !!a)
          .join(", ")}
      </span>
    )}
  </span>
);
