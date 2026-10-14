// The year a name dates from for priority: its original description, i.e. the
// basionym year of a recombination. publishedInYear is the publication of the
// combination itself, so it only counts when no authorship year is known.
export const getPriorityYear = (name) => {
  const year = parseInt(
    name?.basionymAuthorship?.year ??
      name?.combinationAuthorship?.year ??
      name?.publishedInYear,
    10
  );
  return Number.isNaN(year) ? null : year;
};

const datedUsages = (group) =>
  group.usages
    .map((u) => ({ id: u.usage.id, year: getPriorityYear(u.usage.name) }))
    .filter((u) => u.year !== null);

// Ids of the youngest names of each group. Groups whose dated names all share
// one year are skipped, as nothing tells them apart; undated names never match.
export const selectNewest = (groups) =>
  groups.flatMap((group) => {
    const dated = datedUsages(group);
    const years = dated.map((u) => u.year);
    const max = Math.max(...years);
    return max > Math.min(...years)
      ? dated.filter((u) => u.year === max).map((u) => u.id)
      : [];
  });

// Ids of all dated names of each group that are younger than its oldest one
export const selectAllExceptOldest = (groups) =>
  groups.flatMap((group) => {
    const dated = datedUsages(group);
    const min = Math.min(...dated.map((u) => u.year));
    return dated.filter((u) => u.year > min).map((u) => u.id);
  });
