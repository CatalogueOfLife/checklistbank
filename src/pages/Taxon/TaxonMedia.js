import React from "react";
import { Image, Row, Col } from "antd";
import _ from "lodash";

export default ({ media }) => {
  if (!_.isArray(media)) {
    return null;
  }
  return (
    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      {media
        .filter((m) => m.type === "image")
        .map((i) => (
          <Col span={12} style={{ paddingBottom: "12px" }}>
            <Image
              preview={{
                src: i.url,
              }}
              src={`//api.gbif.org/v1/image/unsafe/x260/${i.url}`}
            />
            <div style={{ marginTop: "-4px" }}>
              {i.capturedBy && `©  ${i.capturedBy}`}
            </div>
          </Col>
        ))}
    </Row>
  );
};
