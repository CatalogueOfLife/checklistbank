/**
 * Diffs the issuesCount maps of two release imports.
 *
 * Issues missing from one side count as 0 there, so an issue that appeared or
 * disappeared shows up with the full count as its delta. `change` is the
 * relative change against the previous count and is null when there was
 * nothing to compare against (a new issue), which the table renders as "new".
 */
export const compareIssues = (current, previous) => {
  const cur = current || {};
  const prev = previous || {};
  const issues = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  return [...issues]
    .map((issue) => {
      const count = cur[issue] || 0;
      const previousCount = prev[issue] || 0;
      const delta = count - previousCount;
      return {
        key: issue,
        issue,
        count,
        previousCount,
        delta,
        change: previousCount > 0 ? delta / previousCount : null,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
};
