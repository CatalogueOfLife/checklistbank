import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Space, Tag, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import Linkify from "../../components/Linkify";
import config from "../../config";
import { ValueCard, ValueGrid } from "./ValueCard";
import {
  GAZETTEERS_README,
  GAZETTEERS_VIEWER,
  fetchOrNull,
  gazetteerFile,
} from "./gazetteers";

const { Paragraph, Text } = Typography;

const count = (n) => n.toLocaleString("en");

const GazetteerCard = ({ gazetteer, build }) => {
  // the text gazetteer is free text and has no published entries
  const heading = build ? (
    <Link to={`/vocabulary/gazetteer/${gazetteer.name}`}>{gazetteer.name}</Link>
  ) : (
    gazetteer.name
  );
  return (
    <ValueCard id={gazetteer.name} heading={heading}>
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
        <div>
          <Linkify>{gazetteer.link}</Linkify>
        </div>
      )}
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
        <ValueGrid>
          {gazetteers.map((g) => (
            <GazetteerCard key={g.name} gazetteer={g} build={builds[g.name]} />
          ))}
        </ValueGrid>
      </PageContent>
    </Layout>
  );
};

export default Gazetteer;
