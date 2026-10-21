import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import withRouter from "../../withRouter";
import { taxGroupIconUrl } from "../../api/enumeration";
import { Tree, Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";

// Fall back to the capitalised group name for groups that have no description.
const capitalize = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Key of the single rendered instance whose description popover is open.
// Driving each popover from a shared *instance key* (rather than the group name
// or per-node local state) means: selecting a group closes every other group's
// description, and — for a group rendered under several parents, e.g. algae —
// only one occurrence shows the description, not all of them at once.
const ActivePopoverContext = createContext("");

const TaxGroupTreeNodeTitle = ({ tg, nodeKey }) => {
  const activeKey = useContext(ActivePopoverContext);
  return (
    <Popover
      open={nodeKey === activeKey}
      content={tg["description"] || capitalize(tg["name"])}
    >
      <span style={{ marginLeft: "6px" }}>{tg["name"]}</span>
    </Popover>
  );
};

// The anchor identifies a taxonomic group by name, e.g. .../taxgroup#algae,
// in both the tree and the cards view.
// (Linked from the taxon page — see src/pages/Taxon/index.jsx.)
export const anchorName = (location) =>
  decodeURIComponent((location.hash || "").replace(/^#/, ""));

// groups: the taxgroup vocabulary as returned by the API
const TaxGroupTree = ({ groups, location, navigate }) => {
  const [treeData, setData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  // A group can have several parents (algae sits under both plants and
  // protists), so it is rendered once per parent. Map each group name to the
  // keys of all its rendered instances so an anchor highlights every occurrence.
  const keysByName = useRef({});
  const treeContainer = useRef(null);
  const scrollToSelection = useRef(false);
  // Set when the selection change originates from a user click (rather than an
  // incoming deep link) so the anchor effect below skips the scroll-into-view.
  const suppressScroll = useRef(false);
  // The one instance key whose description popover is shown. A multi-parent
  // group is highlighted at every occurrence but described at only one.
  const [activePopoverKey, setActivePopoverKey] = useState("");
  // Instance key of the node the user clicked, consumed by the anchor effect.
  const clickedKey = useRef(null);

  useEffect(() => {
    loadTree(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const loadTree = (array) => {
    const byName = {};
    const childrenOf = {};
    const roots = [];
    array.forEach((tg) => {
      byName[tg.name] = tg;
    });
    array.forEach((tg) => {
      if (tg.parents && tg.parents.length) {
        tg.parents.forEach((p) => {
          (childrenOf[p] = childrenOf[p] || []).push(tg.name);
        });
      } else {
        roots.push(tg.name);
      }
    });

    const keysByName_ = {};
    const expandedKeys_ = [];

    // Assign a unique key per rendered instance (path-based) so multi-parent
    // groups don't collide; ancestors guard against accidental cycles.
    const buildNode = (name, parentKey, ancestors) => {
      const tg = byName[name];
      const key = parentKey ? `${parentKey}/${name}` : name;
      (keysByName_[name] = keysByName_[name] || []).push(key);
      const nextAncestors = new Set(ancestors).add(name);
      const children = (childrenOf[name] || [])
        .filter((child) => !nextAncestors.has(child))
        .map((child) => buildNode(child, key, nextAncestors));
      if (children.length) {
        expandedKeys_.push(key);
      }
      return {
        key,
        title: <TaxGroupTreeNodeTitle tg={tg} nodeKey={key} />,
        icon: <img src={taxGroupIconUrl(tg.name, 64)} alt="" style={{ width: 24, height: 24 }} />,
        children,
      };
    };

    const treeData_ = roots.map((r) => buildNode(r, null, new Set()));

    keysByName.current = keysByName_;
    setData(treeData_);
    setExpandedKeys(expandedKeys_);
  };

  // Highlight the anchored group once the hash changes or the tree finishes
  // loading. Runs with an empty map on mount (fetch is async) and again once
  // treeData — and therefore keysByName — is populated.
  useEffect(() => {
    const target = anchorName(location);
    const keys = target ? keysByName.current[target] || [] : [];
    scrollToSelection.current = keys.length > 0 && !suppressScroll.current;
    suppressScroll.current = false;
    setSelectedKeys(keys);
    // Describe the instance the user clicked; on a deep link (or a stale click
    // that belongs to another group) fall back to the first occurrence.
    const clicked = clickedKey.current;
    clickedKey.current = null;
    setActivePopoverKey(
      clicked && keys.includes(clicked) ? clicked : keys[0] || ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, treeData]);

  // Selecting a node replaces any prior selection and deep-links to the group.
  // We anchor by NAME (not the instance key) so every rendered occurrence of a
  // multi-parent group — e.g. both copies of algae — highlights together; the
  // anchor effect above turns the name back into all matching instance keys.
  const onSelect = (keys, info) => {
    const key = String(info?.node?.key ?? "");
    const name = key.split("/").pop();
    if (!name) return;
    // Remember the clicked instance so its — and only its — description shows.
    // Set it directly too: re-selecting a different occurrence of the already
    // anchored group still moves the popover even though the hash won't change.
    clickedKey.current = key;
    setActivePopoverKey(key);
    suppressScroll.current = true;
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${encodeURIComponent(name)}`,
      },
      { replace: true }
    );
  };

  // Scroll the anchored node into view — but not when the user clicks a node.
  useEffect(() => {
    if (!scrollToSelection.current || !selectedKeys.length) return;
    scrollToSelection.current = false;
    const raf = requestAnimationFrame(() => {
      const el = treeContainer.current?.querySelector(".ant-tree-node-selected");
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedKeys]);

  return (
    <ActivePopoverContext.Provider value={activePopoverKey}>
      <div ref={treeContainer} className="taxgroup-tree">
        <Tree
          showLine={{ showLeafIcon: false }}
          // multiple: a group with several parents is rendered once per
          // parent; without this rc-tree only highlights the first of an
          // anchor's occurrences (calcSelectedKeys drops the rest).
          multiple
          onSelect={onSelect}
          selectedKeys={selectedKeys}
          showIcon={true}
          switcherIcon={<DownOutlined />}
          defaultExpandAll={true}
          onExpand={setExpandedKeys}
          expandedKeys={expandedKeys}
          treeData={treeData}
        />
      </div>
    </ActivePopoverContext.Provider>
  );
};

export default withRouter(TaxGroupTree);
