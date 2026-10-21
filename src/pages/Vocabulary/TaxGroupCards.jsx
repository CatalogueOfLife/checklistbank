import React, { useEffect, useMemo, useRef } from "react";
import { Card, Typography, theme } from "antd";
import withRouter from "../../withRouter";
import { anchorName } from "./TaxGroupTree";

const { Title, Text, Paragraph } = Typography;

// The parent a group is shown under. Algae sits under both plants and
// protists, but appears only once in the flat view: under its primary parent.
const primaryParent = (tg) => tg.primaryParent || tg.parents?.[0];

// Splits the vocabulary into sections of one major group each. A root whose
// children have children of their own (eukaryotes) is too broad for a single
// section: it stands alone and each of its children heads a section instead.
// Within a section groups keep the vocabulary order.
const buildSections = (groups) => {
  const byName = Object.fromEntries(groups.map((tg) => [tg.name, tg]));
  const hasChildren = new Set(groups.map(primaryParent).filter(Boolean));
  const heads = new Set();
  groups
    .filter((tg) => !primaryParent(tg))
    .forEach((root) => {
      heads.add(root.name);
      const children = groups.filter((tg) => primaryParent(tg) === root.name);
      if (children.some((c) => hasChildren.has(c.name))) {
        children.forEach((c) => heads.add(c.name));
      }
    });

  const sections = [];
  const sectionOf = {};
  const sectionFor = (name) => {
    if (!sectionOf[name]) {
      sectionOf[name] = { head: name, groups: [] };
      sections.push(sectionOf[name]);
    }
    return sectionOf[name];
  };
  groups.forEach((tg) => {
    // the first section head up the primary parent chain, guarding cycles
    const seen = new Set();
    let name = tg.name;
    while (name && !seen.has(name)) {
      seen.add(name);
      if (heads.has(name)) break;
      name = primaryParent(byName[name] || {});
    }
    sectionFor(name || tg.name).groups.push(tg);
  });
  return { byName, sections };
};

// The primary parents of a group from its root down, excluding the group.
const pathOf = (tg, byName) => {
  const path = [];
  const seen = new Set([tg.name]);
  let parent = primaryParent(tg);
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    path.unshift(parent);
    parent = primaryParent(byName[parent] || {});
  }
  return path;
};

const IconTaxa = ({ taxa }) => {
  if (!taxa?.length) return null;
  return (
    <Text type="secondary">
      {taxa.length > 1 ? "Composite: " : "Silhouette: "}
      {taxa.map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && " + "}
          <i>{t}</i>
        </React.Fragment>
      ))}
    </Text>
  );
};

const TaxGroupCard = ({ tg, byName, selected, onSelect }) => {
  const { token } = theme.useToken();
  const path = pathOf(tg, byName);
  const otherParents = (tg.parents || []).filter(
    (p) => p !== primaryParent(tg)
  );
  return (
    <Card
      size="small"
      hoverable
      data-taxgroup={tg.name}
      onClick={() => onSelect(tg.name)}
      style={
        selected
          ? {
              borderColor: token.colorPrimary,
              boxShadow: `0 0 0 1px ${token.colorPrimary}`,
            }
          : undefined
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "88px 1fr",
          gap: "14px",
          alignItems: "start",
        }}
      >
        <img
          src={tg.iconSVG}
          alt={`${tg.name} icon`}
          style={{ width: 88, height: 88 }}
        />
        <div style={{ minWidth: 0, display: "grid", gap: "2px" }}>
          {path.length > 0 && (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {path.join(" › ")}
              {otherParents.length > 0 && ` · also in ${otherParents.join(", ")}`}
            </Text>
          )}
          <Title level={5} style={{ margin: 0 }}>
            {tg.name}
          </Title>
          <IconTaxa taxa={tg.iconTaxa} />
        </div>
      </div>
      {tg.description && (
        <Paragraph style={{ margin: "10px 0 0" }}>{tg.description}</Paragraph>
      )}
    </Card>
  );
};

// groups: the taxgroup vocabulary as returned by the API
const TaxGroupCards = ({ groups, location, navigate }) => {
  const { byName, sections } = useMemo(() => buildSections(groups), [groups]);
  const container = useRef(null);
  // Set when the anchor changes because a card was clicked, which is in view
  // already, so the effect below skips the scroll-into-view.
  const suppressScroll = useRef(false);
  const selected = anchorName(location);

  // Scroll the anchored card into view on a deep link.
  useEffect(() => {
    if (suppressScroll.current || !selected) {
      suppressScroll.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => {
      const el = [
        ...(container.current?.querySelectorAll("[data-taxgroup]") || []),
      ].find((e) => e.dataset.taxgroup === selected);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [selected, sections]);

  const onSelect = (name) => {
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

  return (
    <div ref={container}>
      {sections.map((s) => (
        <section key={s.head} style={{ marginBottom: "32px" }}>
          <Title level={4}>{s.head}</Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: "12px",
            }}
          >
            {s.groups.map((tg) => (
              <TaxGroupCard
                key={tg.name}
                tg={tg}
                byName={byName}
                selected={tg.name === selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default withRouter(TaxGroupCards);
