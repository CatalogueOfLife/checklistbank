// The columns of the scale, from the longest time spans to the shortest.
export const RANKS = ["supereon", "eon", "era", "period", "subperiod", "epoch", "age"];

const FALLBACK_COLOR = "#f5f5f5";

const byStart = (a, b) => (a.start ?? Infinity) - (b.start ?? Infinity);

// Lays the flat vocabulary out as one table with the youngest time span on top. Each
// span without children takes one row and a parent spans the rows of its children.
// Columns are 0 based with an exclusive end. Not all spans use all ranks: a parent
// fills the columns up to its first child and a span without children all the
// remaining ones, so Phanerozoic also takes the supereon column.
export const buildScale = (items) => {
  const names = new Set(items.map((i) => i.name));
  const childrenOf = {};
  const roots = [];
  items.forEach((item) => {
    if (names.has(item.parent)) {
      (childrenOf[item.parent] = childrenOf[item.parent] || []).push(item);
    } else {
      roots.push(item);
    }
  });

  const cells = [];
  const leaves = [];
  const place = (item, colStart, parentColor) => {
    const children = (childrenOf[item.name] || []).sort(byStart);
    const color = item.color || parentColor;
    const colEnd = children.length
      ? Math.max(colStart + 1, Math.min(...children.map((c) => RANKS.indexOf(c.type))))
      : RANKS.length;
    const rowStart = leaves.length;
    const cell = { item, color, colStart, colEnd, rowStart };
    cells.push(cell);
    if (children.length) {
      children.forEach((c) => place(c, colEnd, color));
    } else {
      leaves.push(item);
    }
    cell.rowEnd = leaves.length;
  };
  roots.sort(byStart).forEach((root) => place(root, 0, FALLBACK_COLOR));
  return { cells, leaves };
};

// The official colours of the chart, as served by the API, are too strong to read a
// long table on. Mixes them with white, which also makes black text work on all of them.
export const lighten = (hex, white = 0.55) =>
  "#" +
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16))
    .map((c) => Math.round(c + (255 - c) * white))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("");
