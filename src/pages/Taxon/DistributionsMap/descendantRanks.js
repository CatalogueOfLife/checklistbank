export const INFRASPECIFIC_RANKS = [
  "subspecies",
  "variety",
  "subvariety",
  "form",
  "subform",
  "infraspecific name",
];

export const getDescendantRanks = (focalRank, rankOrder) => {
  const focalIdx = rankOrder.indexOf(focalRank);
  if (focalIdx === -1) return [];
  return INFRASPECIFIC_RANKS.filter((r) => {
    const i = rankOrder.indexOf(r);
    return i > focalIdx;
  });
};
