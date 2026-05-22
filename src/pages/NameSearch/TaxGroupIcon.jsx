import React from "react";
import withContext from "../../components/hoc/withContext";

/**
 * Computes the display depth of every group in the vocabulary.
 * Depth 0 = root (no parents). For DAG nodes with multiple parents the depth
 * is max(parent depths) + 1, so the entry is indented under its deepest parent.
 *
 * @param {Object} taxGroup - vocabulary map keyed by name (from context)
 * @returns {Object} map of name → depth number
 */
export function computeGroupDepths(taxGroup) {
  if (!taxGroup) return {};
  const depths = {};

  function getDepth(name) {
    if (name in depths) return depths[name];
    // Guard against cycles / missing entries
    depths[name] = 0;
    const parents = taxGroup[name]?.parents;
    if (parents && parents.length > 0) {
      depths[name] = Math.max(...parents.map(getDepth)) + 1;
    }
    return depths[name];
  }

  for (const name of Object.keys(taxGroup)) {
    getDepth(name);
  }
  return depths;
}

/**
 * Given an array of taxGroup names and the full taxGroup vocabulary map,
 * removes ancestors that have exactly one descendant in the set — they are
 * redundant because the more specific child already conveys the same scope.
 * Ancestors with 0 children (leaves) or ≥2 children (meaningful branch) are kept.
 *
 * Works correctly in a single pass even for deep linear chains, because each
 * node is evaluated independently against the original set.
 *
 * @param {string[]} groups - array of taxGroup name values
 * @param {Object} taxGroup - vocabulary map keyed by name (from context)
 * @returns {string[]} filtered array
 */
export function filterRedundantGroups(groups, taxGroup) {
  if (!groups || !taxGroup || groups.length <= 1) return groups || [];

  const groupSet = new Set(groups);

  // Count direct children present in the set for each group
  const childCountInSet = new Map();
  for (const g of groups) {
    const parents = taxGroup[g]?.parents;
    if (parents) {
      for (const parent of parents) {
        if (groupSet.has(parent)) {
          childCountInSet.set(parent, (childCountInSet.get(parent) || 0) + 1);
        }
      }
    }
  }

  // Drop groups that have exactly one child in the set (redundant ancestor)
  return groups.filter((g) => (childCountInSet.get(g) || 0) !== 1);
}

const TaxGroupIcon = ({ group, taxGroup, size = 24 }) => {
  const icon = taxGroup?.[group]?.icon;
  if (!icon) return null;
  return (
    <img
      src={icon}
      alt={group}
      title={group}
      style={{ width: size, height: size }}
    />
  );
};

const mapContextToProps = ({ taxGroup }) => ({ taxGroup });

export default withContext(mapContextToProps)(TaxGroupIcon);
