import React, { useState } from "react";
import { Image, Row, Col, Button } from "antd";
import _ from "lodash";

const PAGE_SIZE = 10;
export default ({ media }) => {
  if (!_.isArray(media)) {
    return null;
  }
  const [limit, setLimit] = useState(PAGE_SIZE);
  return (
    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      {media
        .slice(0, limit)
        .filter((m) => m.type === "image" && !!m.url)
        .map((i) => (
          <Col key={i.url} span={12} style={{ paddingBottom: "12px" }}>
            {i.url.indexOf("zenodo.org") === -1 ? (
              <Image
                preview={{
                  src: i.url,
                }}
                src={`//api.gbif.org/v1/image/unsafe/x260/${i.url}`}
              />
            ) : (
              <Image
                preview={{
                  src: i.url,
                }}
                height={260}
                src={i.url}
              />
            )}
            <div style={{ marginTop: "-4px" }}>
              {i.title || ""}
              {i.capturedBy && `©  ${i.capturedBy}`}
              {i.rightsHolder && `©  ${i.rightsHolder}`}
              {i.link && (
                <>
                  <br />
                  <a href={i.link}>{i.link} </a>
                </>
              )}
            </div>
          </Col>
        ))}
      {media.length > limit && (
        <Col span={24} style={{ textAlign: "right", marginBottom: "8px" }}>
          {limit > PAGE_SIZE && (
            <Button
              style={{ marginRight: "8px" }}
              onClick={() => setLimit(PAGE_SIZE)}
            >
              Show fewer
            </Button>
          )}
          <Button onClick={() => setLimit(limit + PAGE_SIZE)}>Show more</Button>
        </Col>
      )}
    </Row>
  );
};
