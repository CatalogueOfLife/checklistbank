import * as React from "react";
import HolderOutlined from "@ant-design/icons/HolderOutlined";
import RcTree, { TreeNode } from "col-rc-tree";
import classNames from "classnames";
import DirectoryTree from "./DirectoryTree";
import { ConfigProvider } from "antd";
import collapseMotion from "./utils/motion";
import renderSwitcherIcon from "./utils/iconUtil";
import dropIndicatorRender from "./utils/dropIndicator";

const { ConfigContext } = ConfigProvider;

const Tree = React.forwardRef((props, ref) => {
  const { getPrefixCls, direction, virtual } = React.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    showIcon,
    showLine,
    switcherIcon,
    blockNode,
    children,
    checkable,
    selectable,
    draggable,
  } = props;
  const prefixCls = getPrefixCls("tree", customizePrefixCls);
  const newProps = {
    ...props,
    showLine: Boolean(showLine),
    dropIndicatorRender,
  };

  /*   const draggableConfig = React.useMemo(() => {
    if (!draggable) {
      return false;
    }

    let mergedDraggable = {};
    switch (typeof draggable) {
      case "function":
        mergedDraggable.nodeDraggable = draggable;
        break;

      case "object":
        mergedDraggable = { ...draggable };
        break;

      default:
      // Do nothing
    }

    if (mergedDraggable.icon !== false) {
      mergedDraggable.icon = mergedDraggable.icon || <HolderOutlined />;
    }

    return mergedDraggable;
  }, [draggable]); */

  return (
    <RcTree
      itemHeight={20}
      ref={ref}
      virtual={virtual}
      {...newProps}
      prefixCls={prefixCls}
      className={classNames(
        {
          [`${prefixCls}-icon-hide`]: !showIcon,
          [`${prefixCls}-block-node`]: blockNode,
          [`${prefixCls}-unselectable`]: !selectable,
          [`${prefixCls}-rtl`]: direction === "rtl",
        },
        className
      )}
      direction={direction}
      checkable={
        checkable ? (
          <span className={`${prefixCls}-checkbox-inner`} />
        ) : (
          checkable
        )
      }
      selectable={selectable}
      switcherIcon={(nodeProps) =>
        renderSwitcherIcon(prefixCls, switcherIcon, showLine, nodeProps)
      }
      //draggable={draggableConfig}
      draggable={draggable}
    >
      {children}
    </RcTree>
  );
});

Tree.TreeNode = TreeNode;

Tree.DirectoryTree = DirectoryTree;

Tree.defaultProps = {
  checkable: false,
  selectable: true,
  showIcon: false,
  motion: {
    ...collapseMotion,
    motionAppear: false,
  },
  blockNode: false,
};

export default Tree;
