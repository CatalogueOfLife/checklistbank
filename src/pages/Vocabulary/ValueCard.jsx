import React from "react";
import { Card, Image, Tag, Typography } from "antd";
import PresentationItem from "../../components/PresentationItem";
import Linkify from "../../components/Linkify";
import { partitionFields } from "./vocabValues";

const { Title } = Typography;

export const ValueGrid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
      gap: "16px",
      alignItems: "start",
    }}
  >
    {children}
  </div>
);

// A vocabulary value: its name as a heading above a card with the details.
export const ValueCard = ({ id, heading, children, ...rest }) => (
  <section id={id} {...rest}>
    <Title level={5} style={{ margin: "0 0 4px" }}>
      {heading}
    </Title>
    <Card size="small">{children}</Card>
  </section>
);

const FieldValue = ({ value }) => {
  if (typeof value === "string" && value.endsWith(".png")) {
    return <Image src={value} />;
  }
  if (Array.isArray(value) && value.every((v) => typeof v !== "object")) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return <code>{JSON.stringify(value)}</code>;
  }
  return <Linkify>{String(value)}</Linkify>;
};

// The fields of a value as label and value rows, followed by its true flags.
export const ValueFields = ({ item, exclude }) => {
  const { flags, fields } = partitionFields(item, exclude);
  return (
    <>
      {fields.map(([key, value]) => (
        <PresentationItem key={key} label={key}>
          <FieldValue value={value} />
        </PresentationItem>
      ))}
      {flags.length > 0 && (
        <div style={{ marginTop: fields.length > 0 ? "8px" : 0 }}>
          {flags.map((flag) => (
            <Tag key={flag}>{flag}</Tag>
          ))}
        </div>
      )}
    </>
  );
};
