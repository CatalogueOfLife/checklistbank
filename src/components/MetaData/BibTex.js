import React from "react";
import config from "../../config";

const BibTex = ({ datasetKey, style = {} }) => {
  const defaultStyle = {
    height: "40px",
  };
  const url = `${config.dataApi}dataset/${datasetKey}.bib`;
  return (
    <a href={url}>
      <img
        src="/images/bibtex_logo.png"
        style={{ ...defaultStyle, ...style }}
      />
    </a>
  );
};

export default BibTex;
