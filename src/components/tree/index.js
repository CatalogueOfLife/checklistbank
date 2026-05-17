import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { Tree as AntdTree } from "antd";

// antd's Tree (backed by @rc-component/tree) bails out of the drop dispatch
// when the drag was started in a different tree instance — `onNodeDrop`
// checks `dropTargetKey === null` (set only when an internal drag is in
// progress) and would otherwise TypeError on `this.dragNodeProps`. That's
// exactly the case the Catalogue Assembly UI hits: drag a taxon from the
// source tree onto a node in the project tree.
//
// This wrapper sidesteps the limitation by intercepting native HTML5 `drop`
// events on the tree's root element. When the parent passes a `dragNode`
// prop AND the drag didn't originate in this tree (tracked via the
// `onDragStart` callback), the wrapper walks up from the event target to
// find the matching tree node — identified by antd's own `id` attribute
// on `.ant-tree-treenode` elements — and synthesises a Router-5-shaped
// drop event for the caller's `onDrop`.
//
// Same-tree drags continue to go through antd's normal `onDrop` path, so
// the existing reorder logic (handleModify in ColTree.js) is unaffected.

const flattenTreeData = (nodes, out) => {
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    if (n == null) continue;
    out.push(n);
    flattenTreeData(n.children, out);
  }
};

// @rc-component/util's getId sanitises keys to valid HTML id characters
// (letters, digits, hyphen, underscore, colon, period — everything else
// becomes a hyphen) before joining with the tree's auto-generated prefix.
// We mirror that here to match a DOM node back to its data key.
// Mirrors @rc-component/util's getId sanitisation (it produces
// `${prefix}-${sanitisedKey}`).
const sanitiseForId = (s) => String(s).replace(/[^a-zA-Z0-9_.:-]/g, "-");

const DirectoryTree = forwardRef(
  ({ dragNode, onDrop, onDragStart, treeData, ...rest }, ref) => {
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

    // Reset the "drag started here" flag whenever the drag operation ends.
    useEffect(() => {
      const reset = () => {
        internalDragRef.current = false;
      };
      window.addEventListener("dragend", reset);
      return () => window.removeEventListener("dragend", reset);
    }, []);

    // Attach native drop interception only while a cross-tree drag is in
    // flight. Same-tree drags pass through to antd's onDrop unchanged.
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
        const targetEl = e.target?.closest?.(".ant-tree-treenode");
        if (!targetEl?.id) return;
        // antd assigns each tree node id `${treeId}-${sanitisedKey}`. Match
        // by suffix against the (also-sanitised) key from our treeData.
        const targetId = targetEl.id;
        const flat = [];
        flattenTreeData(treeDataRef.current, flat);
        const node = flat.find(
          (n) => n != null && targetId.endsWith("-" + sanitiseForId(n.key))
        );
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

    return (
      // display:contents keeps this wrapper from interposing a layout
      // box between antd's Tree and its caller — antd's virtual scroller
      // sizes itself against the actual parent, which is critical for
      // larger catalogues. The wrapper still exists in the DOM tree, so
      // native event listeners attached to it still catch bubbled
      // drop/dragover events from any descendant.
      <div ref={wrapperRef} style={{ display: "contents" }}>
        <AntdTree.DirectoryTree
          ref={innerRef}
          treeData={treeData}
          onDragStart={handleDragStart}
          onDrop={onDrop}
          {...rest}
        />
      </div>
    );
  }
);
DirectoryTree.displayName = "CrossTreeDirectoryTree";

// Preserve the namespace shape ColTree consumes (`Tree.DirectoryTree`) WITHOUT
// mutating antd's exported Tree object — the previous version did
// `AntdTree.DirectoryTree = DirectoryTree` which replaced antd's own
// DirectoryTree globally for every module that imports `antd`, and that
// reentrancy froze the React tree during the assembly page's initial render.
const Tree = { DirectoryTree };

export default Tree;
