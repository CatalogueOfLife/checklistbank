import React from "react";
import { Image } from "antd";
import _ from "lodash";

export default ({ media }) => {
  if (!_.isArray(media)) {
    return null;
  }

  return media
    .filter((m) => m.type === "image")
    .map((i) => (
      <div>
        <Image
          preview={{
            src: i.url,
          }}
          src={`//api.gbif.org/v1/image/unsafe/200x/${i.url}`}
        />
        <div>{i.capturedBy && `©  ${i.capturedBy}`}</div>
      </div>
    ));
};
