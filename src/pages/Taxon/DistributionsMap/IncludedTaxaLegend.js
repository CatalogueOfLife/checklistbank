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
  maxHeight: 200,
  overflowY: "auto",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
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

const rankLabelStyle = {
  color: "#888",
  fontSize: 11,
  marginLeft: "auto",
  paddingLeft: 8,
};

const footerToggleStyle = {
  marginTop: 4,
  cursor: "pointer",
  color: "#1890ff",
  fontSize: 11,
};

const footerListStyle = {
  marginTop: 4,
  borderTop: "1px solid #eee",
  paddingTop: 4,
  fontStyle: "italic",
  color: "#666",
};

const IncludedTaxaLegend = ({ visibleTaxa, unmappableTaxa }) => {
  const [showUnmappable, setShowUnmappable] = useState(false);
  if (!visibleTaxa.length && !unmappableTaxa.length) return null;
  return (
    <div style={wrapStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Included taxa</div>
      <div style={scrollStyle}>
        {visibleTaxa.map((t) => (
          <div key={t.id} style={rowStyle}>
            <span style={swatchStyle(t.color)} />
            <span style={{ fontStyle: "italic" }}>
              {t.displayName || t.scientificName}
            </span>
            <span style={rankLabelStyle}>{t.rank}</span>
          </div>
        ))}
      </div>
      {unmappableTaxa.length > 0 && (
        <>
          <div
            style={footerToggleStyle}
            onClick={() => setShowUnmappable((v) => !v)}
          >
            {showUnmappable ? "− Hide" : "+"} {unmappableTaxa.length} without map
            data
          </div>
          {showUnmappable && (
            <div style={footerListStyle}>
              {unmappableTaxa.map((t) => (
                <div key={t.id}>{t.displayName || t.scientificName}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IncludedTaxaLegend;
