import React, { useState } from "react";

const wrapStyle = {
  position: "absolute",
  bottom: 8,
  left: 8,
  zIndex: 1000,
  background: "#fff",
  borderRadius: 4,
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  padding: "6px 8px",
  fontSize: 12,
  lineHeight: 1.5,
  maxWidth: 260,
};

const scrollStyle = {
  maxHeight: 240,
  overflowY: "auto",
};

const groupHeadingStyle = {
  fontWeight: 600,
  marginTop: 4,
};

const firstGroupHeadingStyle = {
  ...groupHeadingStyle,
  marginTop: 0,
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  paddingLeft: 4,
};

const swatchStyle = (color) => ({
  display: "inline-block",
  width: 12,
  height: 12,
  background: color,
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 2,
  flex: "0 0 auto",
});

const footerToggleStyle = {
  marginTop: 6,
  cursor: "pointer",
  color: "#1890ff",
  fontSize: 11,
};

const footerWrapStyle = {
  marginTop: 4,
  borderTop: "1px solid #eee",
  paddingTop: 4,
  color: "#666",
};

const footerGroupHeadingStyle = {
  fontWeight: 600,
  marginTop: 4,
};

const footerFirstGroupHeadingStyle = {
  ...footerGroupHeadingStyle,
  marginTop: 0,
};

const footerNameStyle = {
  fontStyle: "italic",
  paddingLeft: 4,
};

const totalCount = (groups) =>
  groups.reduce((sum, g) => sum + g.taxa.length, 0);

const IncludedTaxaLegend = ({ visibleGroups, unmappableGroups }) => {
  const [showUnmappable, setShowUnmappable] = useState(false);
  const visibleCount = totalCount(visibleGroups);
  const unmappableCount = totalCount(unmappableGroups);
  if (visibleCount === 0 && unmappableCount === 0) return null;
  return (
    <div style={wrapStyle}>
      <div style={scrollStyle}>
        {visibleGroups.map((g, i) => (
          <div key={g.rank}>
            <div style={i === 0 ? firstGroupHeadingStyle : groupHeadingStyle}>
              {g.label}
            </div>
            {g.taxa.map((t) => (
              <div key={t.id} style={rowStyle}>
                <span style={swatchStyle(t.color)} />
                <span style={{ fontStyle: "italic" }}>
                  {t.displayName || t.scientificName}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {unmappableCount > 0 && (
        <>
          <div
            style={footerToggleStyle}
            onClick={() => setShowUnmappable((v) => !v)}
          >
            {showUnmappable ? "− Hide" : "+"} {unmappableCount} without map data
          </div>
          {showUnmappable && (
            <div style={footerWrapStyle}>
              {unmappableGroups.map((g, i) => (
                <div key={g.rank}>
                  <div
                    style={
                      i === 0
                        ? footerFirstGroupHeadingStyle
                        : footerGroupHeadingStyle
                    }
                  >
                    {g.label}
                  </div>
                  {g.taxa.map((t) => (
                    <div key={t.id} style={footerNameStyle}>
                      {t.displayName || t.scientificName}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IncludedTaxaLegend;
