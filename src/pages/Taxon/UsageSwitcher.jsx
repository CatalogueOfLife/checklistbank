import React from "react";
import { Select, Tag } from "antd";
import withContext from "../../components/hoc/withContext";

// Switches between the usages of one name, e.g. the accepted usages of a pro parte synonym
const UsageSwitcher = ({ usages, value, onChange, getTaxonomicStatusColor, style }) => (
  <div style={{ display: "flex", alignItems: "center", ...style }}>
    <span style={{ marginRight: "8px", whiteSpace: "nowrap" }}>
      {`${usages.length} usages of this name:`}
    </span>
    <Select
      size="small"
      value={value}
      onChange={onChange}
      popupMatchSelectWidth={false}
      style={{ minWidth: 240, maxWidth: "100%" }}
      options={usages.map((u) => ({
        value: u.id,
        label: (
          <span>
            <Tag color={getTaxonomicStatusColor(u.status)}>{u.status}</Tag>
            {u.accepted?.labelHtml ? (
              <>
                {u.status === "misapplied" ? "to " : "of "}
                <span dangerouslySetInnerHTML={{ __html: u.accepted.labelHtml }} />
              </>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: u.labelHtml || u.label || u.id }} />
            )}
            {u.accordingTo && (
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{` sensu ${u.accordingTo}`}</span>
            )}
          </span>
        ),
      }))}
    />
  </div>
);

const mapContextToProps = ({ getTaxonomicStatusColor }) => ({ getTaxonomicStatusColor });

export default withContext(mapContextToProps)(UsageSwitcher);
