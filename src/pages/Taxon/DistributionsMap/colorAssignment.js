export const VIVID_PALETTE = [
  "#E58606",
  "#5D69B1",
  "#52BCA3",
  "#99C945",
  "#CC61B0",
  "#24796C",
  "#DAA51B",
  "#2F8AC4",
  "#764E9F",
  "#ED645A",
  "#CC3A8E",
  "#A5AA99",
];

const rankIndex = (rank, rankOrder) => {
  const i = rankOrder.indexOf(rank);
  return i === -1 ? rankOrder.length : i;
};

export const assignColors = (taxa, rankOrder) => {
  const sorted = [...taxa].sort((a, b) => {
    const ra = rankIndex(a.rank, rankOrder);
    const rb = rankIndex(b.rank, rankOrder);
    if (ra !== rb) return ra - rb;
    return a.scientificName.localeCompare(b.scientificName);
  });
  const out = {};
  sorted.forEach((t, i) => {
    out[t.id] = VIVID_PALETTE[i % VIVID_PALETTE.length];
  });
  return out;
};
