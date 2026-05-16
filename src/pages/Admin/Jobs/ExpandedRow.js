import React, { useState, useEffect } from "react";
import withContext from "../../../components/hoc/withContext";
import { Spin } from "antd";
import axios from "axios";
import config from "../../../config";

import PresentationItem from "../../../components/PresentationItem";

// Render a labeled JSON block. Replaces the abandoned react-json-print which
// only supported React 16.
const JsonBlock = ({ objectKey, dataObject }) => (
  <PresentationItem label={objectKey}>
    <pre style={{ background: "#f5f5f5", padding: 8, overflow: "auto" }}>
      {JSON.stringify(dataObject, null, 2)}
    </pre>
  </PresentationItem>
);
const getHighlighted = (text, lang) => {
  try {
    const { Prism } = window;
    const html = Prism.highlight(text, Prism.languages[lang], lang);
    return html;
  } catch (error) {
    return text;
  }
};

const ExpandedRow = ({ uuid, addError }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await axios(`${config.dataApi}job/${uuid}`);
        // const res = {data: MockData[0]};
        setData(res?.data);
        setLoading(false);
      } catch (error) {
        addError(error);
        setLoading(false);
      }
    };
    init();
  }, []);
  return (
    <>
      {loading && <Spin></Spin>}

      {data &&
        Object.keys(data)
          .filter((key) => typeof data[key] === "object")
          .map((key) => (
            <JsonBlock key={key} objectKey={key} dataObject={data[key]} />
          ))}
      {data &&
        Object.keys(data)
          .filter((key) => typeof data[key] !== "object")
          .map((key) => (
            <PresentationItem label={key}>{data[key]}</PresentationItem>
          ))}
    </>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(ExpandedRow);
