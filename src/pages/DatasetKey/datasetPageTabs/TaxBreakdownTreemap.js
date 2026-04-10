import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Select, Switch, Button, Spin, Alert, Space, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import * as d3 from "d3";
import config from "../../../config";
import { AppContext } from "../../../components/hoc/ContextProvider";

const { Option } = Select;
const { Text } = Typography;

const RANK_OPTIONS = [
  { value: null, label: "Any" },
  { value: "species", label: "Species" },
  { value: "genus", label: "Genus" },
  { value: "family", label: "Family" },
];

// Convert API nested breakdown { group, count, breakdown[] } to d3 hierarchy input
function toHierarchy(breakdown, taxGroup) {
  function convert(nodes) {
    return nodes.map((node) => {
      const entry = taxGroup?.[node.group];
      const label = entry?.description || node.group;
      const result = { name: label, groupName: node.group, count: node.count };
      if (node.breakdown && node.breakdown.length > 0) {
        result.children = convert(node.breakdown);
      } else {
        result.value = node.count;
      }
      return result;
    });
  }
  return { name: "root", children: convert(breakdown) };
}

const SIZE = 740;
const RADIUS = SIZE / 2;

// Explicit colours for the major taxonomic groups.
// Descendants inherit the nearest ancestor's colour, lightened per ring.
const MAJOR_GROUP_COLORS = {
  eukaryotes: "#cccccc", // grey
  viruses:    "#66089f", // violet
  prokaryotes:"#e53935", // red
  protists:   "#fb8c00", // orange
  fungi:      "#fdd835", // yellow
  plants:     "#43a047", // green
  animals:    "#2373ba", // blue
};


function Sunburst({ data, datasetKey, history }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => b.value - a.value);

    const partition = d3.partition().size([2 * Math.PI, RADIUS]);
    partition(root);

    // Ring width at depth 1 (all rings are equal width in a partition layout)
    const ringWidth =
      (root.children?.[0]?.y1 ?? RADIUS) - (root.children?.[0]?.y0 ?? 0);

    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.004))
      .padRadius(RADIUS / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => Math.max(d.y0, d.y1 - 1));

    // Walk up from a node to find the nearest ancestor (or self) that has a
    // defined major-group colour. Returns the colour and the depth at which it
    // was found (used to compute the lightness offset for child rings).
    function getMajorGroupInfo(d) {
      let node = d;
      while (node && node.depth > 0) {
        const c = MAJOR_GROUP_COLORS[node.data.groupName];
        if (c) return { color: c, anchorDepth: node.depth };
        node = node.parent;
      }
      return { color: "#aaa", anchorDepth: 0 };
    }

    function getFill(d) {
      const { color, anchorDepth } = getMajorGroupInfo(d);
      const base = d3.hsl(color);
      // Lighten each ring below the colour anchor by a small step
      base.l = Math.min(0.88, base.l + (d.depth - anchorDepth) * 0.09);
      return base.toString();
    }

    const g = svg
      .append("g")
      .attr("transform", `translate(${RADIUS},${RADIUS})`);

    // ── Tooltip ──────────────────────────────────────────────────────────────
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "fixed")
      .style("background", "rgba(0,0,0,0.78)")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("z-index", "9999");

    // Returns true if the node itself or any non-root ancestor has no groupName.
    function hasNullGroup(d) {
      let node = d;
      while (node.depth > 0) {
        if (node.data.groupName == null) return true;
        node = node.parent;
      }
      return false;
    }

    // ── Arcs ─────────────────────────────────────────────────────────────────
    g.selectAll("path.arc")
      .data(root.descendants().filter((d) => d.depth > 0 && !hasNullGroup(d)))
      .join("path")
      .attr("class", "arc")
      .attr("d", arc)
      .attr("fill", getFill)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .style("cursor", (d) => (d.data.groupName ? "pointer" : "default"))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.75);
        tooltip
          .style("display", "block")
          .html(
            `<strong>${d.data.groupName}</strong>` +
              (d.data.name !== d.data.groupName
                ? `<br/><span style="font-size:12px;opacity:0.85">${d.data.name}</span>`
                : "") +
              `<br/>${d.value?.toLocaleString()} taxa<br/>` +
              `<span style="font-size:11px;opacity:0.8">Click to browse names</span>`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("display", "none");
      })
      .on("click", function (event, d) {
        if (!d.data.groupName) return;
        tooltip.style("display", "none");
        history.push(`/dataset/${datasetKey}/names?group=${d.data.groupName}`);
      });

    // ── Labels ───────────────────────────────────────────────────────────────
    // Use the short groupName ("plants", "animals") — descriptions are long notes.
    // Font size scales with ring width; capped at 13px, min 8px.
    const fontSize = Math.min(13, Math.max(8, ringWidth * 0.4));
    const charW = fontSize * 0.58; // approximate px per character

    function truncateLabel(text, availPx) {
      if (!text || availPx <= 0) return null;
      const maxChars = Math.floor(availPx / charW);
      if (maxChars < 3) return null;
      if (text.length <= maxChars) return text;
      return text.slice(0, maxChars - 1) + "…";
    }

    // For tangential labels the midpoint of a near-full-circle segment lands at
    // ~180° (the bottom), producing upside-down text.  chooseLabelAngle() shifts
    // the placement toward the top of the segment in that case.
    function chooseLabelAngle(x0, x1) {
      const mid = (x0 + x1) / 2;
      const midDeg = mid * 180 / Math.PI;
      if (midDeg > 90 && midDeg < 270) {
        // Prefer 30° (upper-right) if it lies within the segment
        const preferred = Math.PI / 6;
        if (x0 <= preferred && preferred <= x1) return preferred;
        // Otherwise use the midpoint of whatever portion is in the upper half
        if (x0 < Math.PI / 2)
          return (x0 + Math.min(x1, Math.PI / 2)) / 2;
      }
      return mid;
    }

    // For each segment choose the layout direction that gives more space:
    //   tangential — text curves along the arc, available length = arc length
    //   radial     — text runs center→edge, available length = ring height
    // This ensures small narrow segments still get a label where possible.
    const labelData = [];
    root.descendants().forEach((d) => {
      if (d.depth === 0 || hasNullGroup(d)) return;
      const ringH = d.y1 - d.y0;
      if (ringH < fontSize) return; // ring too thin for any glyph

      const midAngle = (d.x0 + d.x1) / 2;
      const r = (d.y0 + d.y1) / 2;
      const arcLen = (d.x1 - d.x0) * r;
      const name = d.data.groupName;

      let label, rotate, labelAngle;
      if (arcLen >= ringH) {
        // Wide segment: tangential — text follows the arc curve.
        // Use chooseLabelAngle to avoid placing the label upside-down at the bottom.
        labelAngle = chooseLabelAngle(d.x0, d.x1);
        label = truncateLabel(name, arcLen - 6);
        const deg = labelAngle * 180 / Math.PI;
        rotate = deg > 180 ? deg - 180 : deg;
      } else {
        // Narrow segment: radial — text runs from inner to outer radius
        labelAngle = midAngle;
        label = truncateLabel(name, ringH - 6);
        const deg = labelAngle * 180 / Math.PI;
        // Right half: rotate -90° from tangent; left half: +90° to stay readable
        rotate = deg <= 180 ? deg - 90 : deg + 90;
      }

      if (!label) return;
      labelData.push({
        label,
        x: Math.sin(labelAngle) * r,
        y: -Math.cos(labelAngle) * r,
        rotate,
      });
    });

    g.selectAll("text.arc-label")
      .data(labelData)
      .join("text")
      .attr("class", "arc-label")
      .attr("transform", ({ x, y, rotate }) =>
        `translate(${x},${y}) rotate(${rotate})`
      )
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", `${fontSize}px`)
      .style("fill", "#fff")
      .style("pointer-events", "none")
      .text(({ label }) => label);

    // ── Centre label ──────────────────────────────────────────────────────────
    const totalValue = root.value ?? 0;
    const centerG = g.append("g").attr("text-anchor", "middle");
    centerG
      .append("text")
      .attr("dy", "-0.2em")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(totalValue.toLocaleString());
    centerG
      .append("text")
      .attr("dy", "1.1em")
      .style("font-size", "11px")
      .style("fill", "#888")
      .text("total");

    return () => {
      tooltip.remove();
    };
  }, [data, datasetKey, history]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{
        width: "100%",
        maxWidth: SIZE,
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}

const TaxBreakdownTreemap = ({ datasetKey, onClose }) => {
  const { taxGroup } = useContext(AppContext);
  const history = useHistory();

  const [rank, setRank] = useState("species");
  const [inclSynonym, setInclSynonym] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);

  useEffect(() => {
    if (!datasetKey) return;
    setLoading(true);
    setError(null);
    axios(
      `${config.dataApi}dataset/${datasetKey}/breakdown?${
        rank ? `rank=${rank}&` : ""
      }inclSynonyms=${inclSynonym}`
    )
      .then((res) => {
        const breakdown = res.data?.breakdown || [];
        setHierarchyData(toHierarchy(breakdown, taxGroup));
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [datasetKey, rank, inclSynonym]);

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        padding: "12px 16px",
        marginTop: 8,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Space wrap>
          <Text strong>Taxonomic breakdown</Text>
          <Select
            value={rank}
            onChange={setRank}
            size="small"
            style={{ width: 100 }}
          >
            {RANK_OPTIONS.map((r) => (
              <Option key={r.label} value={r.value}>
                {r.label}
              </Option>
            ))}
          </Select>
          <Space size={4}>
            <Switch
              size="small"
              checked={inclSynonym}
              onChange={setInclSynonym}
            />
            <Text style={{ fontSize: 12 }}>Include synonyms</Text>
          </Space>
        </Space>
        <Button
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          type="text"
        />
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin />
        </div>
      )}
      {error && !loading && (
        <Alert
          type="error"
          message="Failed to load breakdown data"
          style={{ marginBottom: 8 }}
        />
      )}
      {!loading && !error && hierarchyData && (
        <Sunburst
          data={hierarchyData}
          datasetKey={datasetKey}
          history={history}
        />
      )}
    </div>
  );
};

export default TaxBreakdownTreemap;
