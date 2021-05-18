import React from "react";

export default ({ person, style }) => (
  <span style={style}>
    <span style={{ display: "block" }}>{`${person.familyName || "-"}${
      person.givenName ? ", " + person.givenName : ""
    }`}</span>
    {person.email && (
      <a style={{ display: "block" }} href={`mailto:${person.email}`}>
        {person.email}
      </a>
    )}
    {person.orcid && (
      <a
        style={{ display: "block" }}
        href={`https://orcid.org/${person.orcid}`}
      >
        <img
          src="/images/orcid_16x16.png"
          style={{ flex: "0 0 auto" }}
          alt=""
        ></img>{" "}
        {person.orcid}
      </a>
    )}
  </span>
);
