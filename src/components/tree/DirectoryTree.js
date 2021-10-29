import * as React from "react";
import classNames from "classnames";
import debounce from "lodash/debounce";
import { conductExpandParent } from "col-rc-tree/lib/util";
import {
  convertDataToEntities,
  convertTreeToData,
} from "col-rc-tree/lib/utils/treeUtil";
import FileOutlined from "@ant-design/icons/FileOutlined";
import FolderOpenOutlined from "@ant-design/icons/FolderOpenOutlined";
import FolderOutlined from "@ant-design/icons/FolderOutlined";
import { ConfigProvider } from "antd";

import Tree from "./Tree";
import { calcRangeKeys, convertDirectoryKeysToNodes } from "./utils/dictUtil";

const { ConfigContext } = ConfigProvider;

function getIcon(props) {
  const { isLeaf, expanded } = props;
  if (isLeaf) {
    return <FileOutlined />;
  }
  return expanded ? <FolderOpenOutlined /> : <FolderOutlined />;
}

function getTreeData({ treeData, children }) {
  return treeData || convertTreeToData(children);
}

const DirectoryTree = (
  { defaultExpandAll, defaultExpandParent, defaultExpandedKeys, ...props },
  ref
) => {
  // Shift click usage
  const lastSelectedKey = React.useRef();

  const cachedSelectedKeys = React.useRef();

  const treeRef = React.createRef();

  React.useImperativeHandle(ref, () => treeRef.current);

  const getInitExpandedKeys = () => {
    const { keyEntities } = convertDataToEntities(getTreeData(props));

    let initExpandedKeys;

    // Expanded keys
    if (defaultExpandAll) {
      initExpandedKeys = Object.keys(keyEntities);
    } else if (defaultExpandParent) {
      initExpandedKeys = conductExpandParent(
        props.expandedKeys || defaultExpandedKeys || [],
        keyEntities
      );
    } else {
      initExpandedKeys = props.expandedKeys || defaultExpandedKeys;
    }
    return initExpandedKeys;
  };

  const [selectedKeys, setSelectedKeys] = React.useState(
    props.selectedKeys || props.defaultSelectedKeys || []
  );
  const [expandedKeys, setExpandedKeys] = React.useState(getInitExpandedKeys());

  React.useEffect(() => {
    if ("selectedKeys" in props) {
      setSelectedKeys(props.selectedKeys);
    }
  }, [props.selectedKeys]);

  React.useEffect(() => {
    if ("expandedKeys" in props) {
      setExpandedKeys(props.expandedKeys);
    }
  }, [props.expandedKeys]);

  const expandFolderNode = (event, node) => {
    const { isLeaf } = node;

    if (isLeaf || event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }

    // Call internal col-rc-tree expand function
    // https://github.com/ant-design/ant-design/issues/12567
    treeRef.current.onNodeExpand(event, node);
  };

  const onDebounceExpand = debounce(expandFolderNode, 200, {
    leading: true,
  });
  const onExpand = (keys, info) => {
    if (!("expandedKeys" in props)) {
      setExpandedKeys(keys);
    }
    // Call origin function
    return props.onExpand?.(keys, info);
  };

  const onClick = (event, node) => {
    const { expandAction } = props;

    // Expand the tree
    if (expandAction === "click") {
      onDebounceExpand(event, node);
    }

    props.onClick?.(event, node);
  };

  const onDoubleClick = (event, node) => {
    const { expandAction } = props;

    // Expand the tree
    if (expandAction === "doubleClick") {
      onDebounceExpand(event, node);
    }

    props.onDoubleClick?.(event, node);
  };

  const onSelect = (keys, event) => {
    const { multiple } = props;
    const { node, nativeEvent } = event;
    const { key = "" } = node;

    const treeData = getTreeData(props);
    // const newState: DirectoryTreeState = {};

    // We need wrap this event since some value is not same
    const newEvent = {
      ...event,
      selected: true, // Directory selected always true
    };

    // Windows / Mac single pick
    const ctrlPick = nativeEvent?.ctrlKey || nativeEvent?.metaKey;
    const shiftPick = nativeEvent?.shiftKey;

    // Generate new selected keys
    let newSelectedKeys;
    if (multiple && ctrlPick) {
      // Control click
      newSelectedKeys = keys;
      lastSelectedKey.current = key;
      cachedSelectedKeys.current = newSelectedKeys;
      newEvent.selectedNodes = convertDirectoryKeysToNodes(
        treeData,
        newSelectedKeys
      );
    } else if (multiple && shiftPick) {
      // Shift click
      newSelectedKeys = Array.from(
        new Set([
          ...(cachedSelectedKeys.current || []),
          ...calcRangeKeys({
            treeData,
            expandedKeys,
            startKey: key,
            endKey: lastSelectedKey.current,
          }),
        ])
      );
      newEvent.selectedNodes = convertDirectoryKeysToNodes(
        treeData,
        newSelectedKeys
      );
    } else {
      // Single click
      newSelectedKeys = [key];
      lastSelectedKey.current = key;
      cachedSelectedKeys.current = newSelectedKeys;
      newEvent.selectedNodes = convertDirectoryKeysToNodes(
        treeData,
        newSelectedKeys
      );
    }

    props.onSelect?.(newSelectedKeys, newEvent);
    if (!("selectedKeys" in props)) {
      setSelectedKeys(newSelectedKeys);
    }
  };
  const { getPrefixCls, direction } = React.useContext(ConfigContext);

  const { prefixCls: customizePrefixCls, className, ...otherProps } = props;

  const prefixCls = getPrefixCls("tree", customizePrefixCls);
  const connectClassName = classNames(
    `${prefixCls}-directory`,
    {
      [`${prefixCls}-directory-rtl`]: direction === "rtl",
    },
    className
  );

  return (
    <Tree
      icon={getIcon}
      ref={treeRef}
      blockNode
      {...otherProps}
      prefixCls={prefixCls}
      className={connectClassName}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      onSelect={onSelect}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onExpand={onExpand}
    />
  );
};

const ForwardDirectoryTree = React.forwardRef(DirectoryTree);
ForwardDirectoryTree.displayName = "DirectoryTree";

ForwardDirectoryTree.defaultProps = {
  showIcon: true,
  expandAction: "click",
};

export default ForwardDirectoryTree;
