// The usage and the name of a usage are separate urls, .../taxon/{usageId} and .../name/{nameId},
// rendered as tabs of this one page. Returns the path before that segment and the segment.
export const parseUsagePath = (pathname) => {
  const m = (pathname || "").match(/^(.*)\/(taxon|nameusage|name)\/[^/]+/);
  return m ? { prefix: m[1], section: m[2] } : { prefix: "", section: "taxon" };
};

// The usage a name page shows: the requested one, else an accepted one, else the first
export const pickUsage = (usages, requestedId) =>
  usages.find((u) => u.id === requestedId) ||
  usages.find((u) => ["accepted", "provisionally accepted"].includes(u.status)) ||
  usages[0] ||
  null;
