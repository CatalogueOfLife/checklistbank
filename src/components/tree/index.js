import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Tree as AntdTree } from "antd";

// antd's Tree (backed by @rc-component/tree) bails out of the drop dispatch
// when the drag was started in a different tree instance — `onNodeDrop` checks
// `dropTargetKey === null` (set only when an internal drag is in progress) and
// would otherwise TypeError on `this.dragNodeProps`. That's exactly the case
// the Catalogue Assembly UI hits: drag a taxon from the source tree onto a
// node in the project tree.
//
// This wrapper sidesteps the limitation by intercepting native HTML5 `drop`
// events on the tree's root element. When the parent passes a `dragNode` prop
// AND the drag didn't originate in this tree (tracked via the `dragstart`
// callback), the wrapper walks up from the event target to find the
// matching tree node — identified by a `data-cross-tree-node-key` attribute
// injected via `titleRender` — and synthesises a Router-5-shaped drop event
// for the caller's `onDrop`.
//
// Same-tree drags continue to go through antd's normal `onDrop` path, so
// existing reorder logic (handleModify in ColTree.js) is unaffected.

const findInTreeData = (nodes, key) => {
  if (!Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (n == null) continue;
    if (String(n.key) === key) return n;
    const child = findInTreeData(n.children, key);
    if (child) return child;
  }
  return null;
};

const wrapTitle = (node, originalTitleRender) => {
  const rendered = originalTitleRender ? originalTitleRender(node) : node.title;
  return (
    <span data-cross-tree-node-key={String(node.key)}>{rendered}</span>
  );
};

const DirectoryTree = forwardRef(
  (
    {
      dragNode,
      onDrop,
      onDragStart,
      treeData,
      titleRender,
      ...rest
    },
    ref
  ) => {
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const internalDragRef = useRef(false);
    const treeDataRef = useRef(treeData);
    treeDataRef.current = treeData;

    // Forward the antd Tree's ref so callers can still do scrollTo({ key }).
    useEffect(() => {
      if (typeof ref === "function") ref(innerRef.current);
      else if (ref) ref.current = innerRef.current;
    });

    const handleDragStart = useCallback(
      (info) => {
        internalDragRef.current = true;
        onDragStart?.(info);
      },
      [onDragStart]
    );

    // Reset the "drag started here" flag when the drag operation ends, no
    // matter where it ended (drop, escape, off-window release).
    useEffect(() => {
      const reset = () => {
        internalDragRef.current = false;
      };
      window.addEventListener("dragend", reset);
      return () => window.removeEventListener("dragend", reset);
    }, []);

    // Only attach native drop interception when a cross-tree drag is in
    // flight (dragNode is set on the parent) AND the drag didn't start in
    // this tree. The same-tree case is left alone — antd's onDrop dispatches
    // correctly with both e.node and e.dragNode populated.
    useEffect(() => {
      if (!dragNode) return undefined;
      const el = wrapperRef.current;
      if (!el) return undefined;

      const onNativeDragOver = (e) => {
        if (internalDragRef.current) return;
        // preventDefault is required to receive the subsequent drop event.
        e.preventDefault();
      };

      const onNativeDrop = (e) => {
        if (internalDragRef.current) return;
        const targetEl = e.target?.closest?.("[data-cross-tree-node-key]");
        if (!targetEl) return;
        const key = targetEl.getAttribute("data-cross-tree-node-key");
        const node = findInTreeData(treeDataRef.current, key);
        if (!node) return;
        e.preventDefault();
        onDrop?.({ event: e, node, dragNode });
      };

      el.addEventListener("dragover", onNativeDragOver);
      el.addEventListener("drop", onNativeDrop);
      return () => {
        el.removeEventListener("dragover", onNativeDragOver);
        el.removeEventListener("drop", onNativeDrop);
      };
    }, [dragNode, onDrop]);

    const wrappedTitleRender = useMemo(
      () => (node) => wrapTitle(node, titleRender),
      [titleRender]
    );

    return (
      <div ref={wrapperRef}>
        <AntdTree.DirectoryTree
          ref={innerRef}
          treeData={treeData}
          onDragStart={handleDragStart}
          onDrop={onDrop}
          titleRender={wrappedTitleRender}
          {...rest}
        />
      </div>
    );
  }
);
DirectoryTree.displayName = "CrossTreeDirectoryTree";

// Preserve the namespace shape ColTree consumes: `Tree.DirectoryTree`.
const Tree = AntdTree;
Tree.DirectoryTree = DirectoryTree;

export default Tree;
