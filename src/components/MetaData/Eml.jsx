import React from "react";
import config from "../../config";

const Eml = ({ datasetKey, style = {} }) => {
  const defaultStyle = {
    height: "40px",
  };
  const url = `${config.dataApi}dataset/${datasetKey}.xml`;
  return (
    <a href={url}>
      <img
        src="/images/eml_logo.png"
        style={{ ...defaultStyle, ...style }}
      />
    </a>
  );
};

export default Eml;
