import React from "react";
import { Typography } from "antd";
import toolsDescriptions from "./toolsMeta";

const { Paragraph } = Typography;

// Short description shown at the top of a tool page. The tool title itself is
// rendered in the header bar (via Layout's `title` prop), so it is not
// repeated here. Reads its text from toolsMeta by `id`; an explicit
// `description` prop overrides the looked-up value.
const ToolHeader = ({ id, description }) => {
  const text = description || (id && toolsDescriptions[id]);
  if (!text) return null;
  return (
    <Paragraph type="secondary" style={{ marginBottom: 24 }}>
      {text}
    </Paragraph>
  );
};

export default ToolHeader;
