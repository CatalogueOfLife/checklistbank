import React from "react";

const DoiPresentation = ({ doi }) => (
  <a style={{ display: "block" }} href={`https://doi.org/${doi}`}>
    <img
      src="/images/DOI_logo.png"
      style={{ flex: "0 0 auto", height: "16px" }}
      alt=""
    ></img>{" "}
    {doi}
  </a>
);

export default DoiPresentation;
