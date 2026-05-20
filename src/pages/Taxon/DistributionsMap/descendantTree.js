const byName = (a, b) => a.scientificName.localeCompare(b.scientificName);

export const buildTree = (taxa, focalId) => {
  const ids = new Set(taxa.map((t) => t.id));
  const byParent = {};
  const roots = [];
  taxa.forEach((t) => {
    const isRoot = t.parentId === focalId || !ids.has(t.parentId);
    if (isRoot) {
      roots.push(t);
    } else {
      (byParent[t.parentId] = byParent[t.parentId] || []).push(t);
    }
  });
  roots.sort(byName);
  Object.values(byParent).forEach((arr) => arr.sort(byName));
  return { roots, byParent };
};
