import { TagOutlined } from "@ant-design/icons";
import { Popover, Tag } from "antd";
import config from "../../config";
import _ from "lodash";
import { getTypeColor } from "./TypeMaterial";
import linkify from "linkify-html";
import MergedDataBadge from "../../components/MergedDataBadge";

const TypeMaterialPopover = ({ typeMaterial, nameId, placement, datasetKey, references }) => {
  const getContent = () => {
    const data = typeMaterial?.[nameId] || [];
    if (data.length === 1) {
      return data[0].citation;
    } else {
      return (
        <ul>
          {data.map((s) => (
            <>
              {" "}
              <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag>
              {s.merged && (
                <>
                  <MergedDataBadge />{" "}
                </>
              )}
              {s?.citation && (
                <span
                  dangerouslySetInnerHTML={{
                    __html: linkify(s?.citation || ""),
                  }}
                ></span>
              )}
            </>
          ))}
        </ul>
      );
    }
  };

  const data = typeMaterial?.[nameId] || [];

  return data.length > 0 ? (
    <Popover
      placement={placement || "left"}
      title="Type Material"
      content={<div style={{ maxWidth: "500px" }}>{getContent()}</div>}
      trigger="click"
    >
      {" "}
      <TagOutlined style={{ cursor: "pointer" }} />
    </Popover>
  ) : (
    ""
  );
};

export default TypeMaterialPopover;
