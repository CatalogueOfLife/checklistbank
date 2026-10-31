import React from "react";
import { Link } from "react-router-dom";
import { Card, Image, Tag, Typography } from "antd";
import PresentationItem from "../../components/PresentationItem";
import Linkify from "../../components/Linkify";
import { partitionFields } from "./vocabValues";

const { Title } = Typography;

// One value per row, as the order of a vocabulary often has a meaning.
export const ValueList = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>
);

// A vocabulary value: its name as a heading above a card with the details. With `to`
// all of the card links there: anchors can't nest, so a link covers the card and any
// link inside the card has to be positioned to stay on top of it.
export const ValueCard = ({ id, heading, to, children, ...rest }) => (
  <section id={id} {...rest}>
    <Title level={5} style={{ margin: "0 0 4px" }}>
      {to ? <Link to={to}>{heading}</Link> : heading}
    </Title>
    <Card size="small" hoverable={!!to} style={{ background: "#fafafa" }}>
      {to && (
        <Link
          to={to}
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0 }}
        />
      )}
      {children}
    </Card>
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
