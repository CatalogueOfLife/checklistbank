import React from "react";
import config from "../../config";

const Yaml = ({ datasetKey, style = {} }) => {
  const defaultStyle = {
    height: "40px",
  };
  const url = `${config.dataApi}dataset/${datasetKey}.yaml`;
  return (
    <a href={url}>
      <img
        src="/images/yaml_logo.png"
        style={{ ...defaultStyle, ...style }}
      />
    </a>
  );
};

export default Yaml;
