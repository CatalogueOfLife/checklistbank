import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import { Row, Col, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import { Image, Tree, Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";

const { Title } = Typography;

// Fall back to the capitalised group name for groups that have no description.
const capitalize = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Name of the currently selected/anchored group. Driving each popover's open
// state from this shared value (rather than per-node local state) means
// selecting a new group closes every other group's description, instead of
// leaving a trail of open popovers behind.
const ActiveGroupContext = createContext("");

const TaxGroupTreeNodeTitle = ({ tg }) => {
  const activeGroup = useContext(ActiveGroupContext);
  return (
    <Popover
      open={tg["name"] === activeGroup}
      content={tg["description"] || capitalize(tg["name"])}
    >
      <span style={{ marginLeft: "6px" }}>{tg["name"]}</span>
    </Popover>
  );
};

// The anchor identifies a taxonomic group by name, e.g. .../taxgrouptree#algae.
// (Linked from the taxon page — see src/pages/Taxon/index.jsx.)
const anchorName = (location) =>
  decodeURIComponent((location.hash || "").replace(/^#/, ""));

const TaxGroupTree = ({ location, navigate }) => {
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

  useEffect(() => {
    fetch(`${config.dataApi}vocab/taxgroup`)
      .then((response) => response.json())
      .then((data) => loadTree(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        title: <TaxGroupTreeNodeTitle tg={tg} />,
        icon: <Image height={24} src={tg.iconSVG} />,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, treeData]);

  // Selecting a node replaces any prior selection and deep-links to the group.
  // We anchor by NAME (not the instance key) so every rendered occurrence of a
  // multi-parent group — e.g. both copies of algae — highlights together; the
  // anchor effect above turns the name back into all matching instance keys.
  const onSelect = (keys, info) => {
    const name = String(info?.node?.key ?? "").split("/").pop();
    if (!name) return;
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
    <Layout
      title={`Taxonomic Groups`}
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto">
            <Typography.Paragraph>
              <Link to="/vocabulary/taxgroup">View as a flat list</Link>
            </Typography.Paragraph>
            <ActiveGroupContext.Provider value={anchorName(location)}>
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
            </ActiveGroupContext.Provider>
          </Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = () => ({});
export default withContext(mapContextToProps)(withRouter(TaxGroupTree));
