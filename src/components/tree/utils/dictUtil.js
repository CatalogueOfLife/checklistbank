const Record = {
  None: 0,
  Start: 1,
  End: 2,
};

function traverseNodesKey(treeData, callback) {
  function processNode(dataNode) {
    const { key, children } = dataNode;
    if (callback(key, dataNode) !== false) {
      traverseNodesKey(children || [], callback);
    }
  }

  treeData.forEach(processNode);
}

/** 计算选中范围，只考虑expanded情况以优化性能 */
export function calcRangeKeys({ treeData, expandedKeys, startKey, endKey }) {
  const keys = [];
  let record = Record.None;

  if (startKey && startKey === endKey) {
    return [startKey];
  }
  if (!startKey || !endKey) {
    return [];
  }

  function matchKey(key) {
    return key === startKey || key === endKey;
  }

  traverseNodesKey(treeData, (key) => {
    if (record === Record.End) {
      return false;
    }

    if (matchKey(key)) {
      // Match test
      keys.push(key);

      if (record === Record.None) {
        record = Record.Start;
      } else if (record === Record.Start) {
        record = Record.End;
        return false;
      }
    } else if (record === Record.Start) {
      // Append selection
      keys.push(key);
    }

    if (expandedKeys.indexOf(key) === -1) {
      return false;
    }

    return true;
  });

  return keys;
}

export function convertDirectoryKeysToNodes(treeData, keys) {
  const restKeys = [...keys];
  const nodes = [];
  traverseNodesKey(treeData, (key, node) => {
    const index = restKeys.indexOf(key);
    if (index !== -1) {
      nodes.push(node);
      restKeys.splice(index, 1);
    }

    return !!restKeys.length;
  });
  return nodes;
}
