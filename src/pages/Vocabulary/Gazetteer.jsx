import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Space, Tag, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import Linkify from "../../components/Linkify";
import config from "../../config";
import { ValueCard, ValueList } from "./ValueCard";
import {
  GAZETTEERS_README,
  GAZETTEERS_VIEWER,
  fetchOrNull,
  gazetteerFile,
} from "./gazetteers";

const { Paragraph, Text } = Typography;

const count = (n) => n.toLocaleString("en");

// A small world view of a gazetteer. Those without one, like text, just show none.
const GazetteerThumbnail = ({ gazetteer }) => {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <img
      src={gazetteerFile(gazetteer.name, "map-thumb.png")}
      alt={`World map of ${gazetteer.title}`}
      width={240}
      height={120}
      loading="lazy"
      onError={() => setMissing(true)}
      style={{ flex: "none", maxWidth: "100%", height: "auto" }}
    />
  );
};

const GazetteerCard = ({ gazetteer, build }) => {
  // the text gazetteer is free text and has no published entries
  const to = gazetteer.name === "text" ? undefined : `/vocabulary/gazetteer/${gazetteer.name}`;
  return (
    <ValueCard id={gazetteer.name} heading={gazetteer.name} to={to}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <Paragraph strong style={{ marginBottom: "4px" }}>
            {gazetteer.title}
          </Paragraph>
          {gazetteer.description && (
            <Paragraph style={{ marginBottom: "8px" }}>{gazetteer.description}</Paragraph>
          )}
          {build && (
            <Space wrap size={[4, 4]} style={{ marginBottom: "8px" }}>
              <Tag>{count(build.label_count)} entries</Tag>
              {build.feature_count === 0 && <Tag>no shapes</Tag>}
              {build.built_at && (
                <Text type="secondary">built {build.built_at.substring(0, 10)}</Text>
              )}
            </Space>
          )}
          {gazetteer.link && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <Linkify>{gazetteer.link}</Linkify>
            </div>
          )}
        </div>
        <GazetteerThumbnail gazetteer={gazetteer} />
      </div>
    </ValueCard>
  );
};

// The gazetteers that areas in ChecklistBank can refer to, as {gazetteer}:{id}.
const Gazetteer = () => {
  const [gazetteers, setGazetteers] = useState([]);
  const [builds, setBuilds] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    fetchOrNull(`${config.dataApi}vocab/gazetteer`, { signal })
      .then((all) => {
        setGazetteers(all || []);
        return Promise.allSettled(
          (all || []).map((g) =>
            fetchOrNull(gazetteerFile(g.name, "build.json"), { signal }).then((build) => [
              g.name,
              build,
            ])
          )
        );
      })
      .then((results) => {
        if (signal.aborted) return;
        setBuilds(
          Object.fromEntries(
            results.filter((r) => r.status === "fulfilled").map((r) => r.value)
          )
        );
      })
      .catch((e) => {
        if (!signal.aborted) console.warn("Gazetteers not available:", e);
      });
    return () => controller.abort();
  }, []);

  return (
    <Layout title="Gazetteers" openKeys={["tools"]} selectedKeys={["vocabulary"]}>
      <PageContent>
        <Paragraph style={{ marginTop: "10px" }}>
          Areas in distributions refer to an entry of one of these gazetteers, as{" "}
          <code>gazetteer:id</code>, for example{" "}
          <Link to="/vocabulary/area/iso:DE">iso:DE</Link>. Each gazetteer page lists its
          entries, and each entry has a page with its shape. You can also explore and
          overlay all shapes in the{" "}
          <a href={GAZETTEERS_VIEWER} target="_blank" rel="noopener noreferrer">
            gazetteer viewer
          </a>{" "}
          and read{" "}
          <a href={GAZETTEERS_README} target="_blank" rel="noopener noreferrer">
            how they are built
          </a>
          . This vocabulary is also available from the{" "}
          <a href={`${config.dataApi}vocab/gazetteer`} target="_blank" rel="noopener noreferrer">
            API <ApiOutlined />
          </a>
          .
        </Paragraph>
        <ValueList>
          {gazetteers.map((g) => (
            <GazetteerCard key={g.name} gazetteer={g} build={builds[g.name]} />
          ))}
        </ValueList>
      </PageContent>
    </Layout>
  );
};

export default Gazetteer;
