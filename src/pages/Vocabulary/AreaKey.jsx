import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Collapse, Result, Spin, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import PresentationItem from "../../components/PresentationItem";
import config from "../../config";
import { flattenFeatures } from "../Taxon/DistributionsMap/geo";
import AreaMap from "./AreaMap";
import { ValueFields } from "./ValueCard";
import { areaApiUrl, externalAreaLink, fetchOrNull, parseAreaKey } from "./gazetteers";

const { Paragraph, Text, Title } = Typography;

const GEOJSON = "application/geo+json";
// the identifiers and name are shown in the heading already
const SHOWN_ELSEWHERE = ["gazetteer", "id", "name", "globalId"];

// The API answers with the id as name when it knows no label for an area, and
// changes the case of some ids in doing so.
const hasLabel = (meta, id) =>
  !!meta?.name && meta.name.toLowerCase() !== id.toLowerCase();

const AreaPage = ({ gazetteerName, id }) => {
  const [meta, setMeta] = useState();
  const [gazetteer, setGazetteer] = useState();
  const [shape, setShape] = useState();
  const [shapeFailed, setShapeFailed] = useState(false);

  // Metadata and shape are independent. The API has no metadata for some valid
  // areas, and never had a shape for others, so one must not hide the other.
  // Always uses the id of the URL: the metadata can answer with a changed one.
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const settled = (promise, set, onFailure) =>
      promise.then(
        (value) => signal.aborted || set(value),
        (e) => {
          if (signal.aborted) return;
          console.warn(e);
          set(null);
          onFailure?.();
        }
      );
    settled(fetchOrNull(areaApiUrl(gazetteerName, id), { signal }), setMeta);
    settled(
      fetchOrNull(`${config.dataApi}vocab/gazetteer/${encodeURIComponent(gazetteerName)}`, { signal }),
      setGazetteer
    );
    settled(
      fetchOrNull(areaApiUrl(gazetteerName, id), { accept: GEOJSON, signal }),
      setShape,
      () => setShapeFailed(true)
    );
    return () => controller.abort();
  }, [gazetteerName, id]);

  const features = useMemo(() => flattenFeatures(shape), [shape]);
  // The shape's own properties could collide with what AreaMap styles by.
  const mapData = useMemo(
    () =>
      features.length > 0
        ? {
            type: "FeatureCollection",
            features: features.map((f) => ({ ...f, properties: {} })),
          }
        : null,
    [features]
  );

  const loading = meta === undefined || shape === undefined;
  const properties = features[0]?.properties;
  const shapeName = properties?.name;
  const name = hasLabel(meta, id) ? meta.name : shapeName || id;
  const unknown = !loading && !shape && !hasLabel(meta, id) && !shapeFailed;
  const link = externalAreaLink(gazetteer, id);

  if (!loading && unknown) {
    return (
      <Result
        status="404"
        title={`Unknown area ${gazetteerName}:${id}`}
        subTitle={
          <Link to={`/vocabulary/gazetteer/${gazetteerName}`}>
            All entries of {gazetteerName}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Title level={3} style={{ marginTop: "8px" }}>
        {loading ? `${gazetteerName}:${id}` : name}{" "}
        <a
          href={areaApiUrl(gazetteerName, id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="API"
        >
          <ApiOutlined />
        </a>
      </Title>
      <Paragraph>
        <Text code>
          {gazetteerName}:{id}
        </Text>{" "}
        in{" "}
        <Link to={`/vocabulary/gazetteer/${gazetteerName}`}>
          {gazetteer?.title || gazetteerName}
        </Link>
      </Paragraph>
      {loading ? (
        <Spin />
      ) : (
        <>
          {mapData ? (
            <div style={{ marginBottom: "16px" }}>
              <AreaMap data={mapData} />
            </div>
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: "16px" }}
              title={
                shapeFailed
                  ? "The shape of this area could not be loaded."
                  : "No shape is published for this area."
              }
            />
          )}
          {meta && <ValueFields item={meta} exclude={SHOWN_ELSEWHERE} />}
          {link && (
            <PresentationItem label="source">
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </PresentationItem>
          )}
          {mapData && (
            <PresentationItem label="shape">
              <a
                href={`${areaApiUrl(gazetteerName, id)}.geojson`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GeoJSON
              </a>
            </PresentationItem>
          )}
          {properties && Object.keys(properties).length > 0 && (
            <Collapse
              size="small"
              ghost
              style={{ marginTop: "16px" }}
              items={[
                {
                  key: "properties",
                  label: "Properties of the shape",
                  children: <ValueFields item={properties} exclude={[]} />,
                },
              ]}
            />
          )}
        </>
      )}
    </>
  );
};

// One entry of a gazetteer, at /vocabulary/area/{gazetteer}:{id}
const AreaKey = () => {
  const { id: key } = useParams();
  const area = parseAreaKey(key);
  return (
    <Layout title={`Area: ${key}`} openKeys={["tools"]} selectedKeys={["vocabulary"]}>
      <PageContent>
        <Text type="secondary">
          <Link to="/vocabulary">Vocabularies</Link> /{" "}
          <Link to="/vocabulary/gazetteer">gazetteer</Link>
          {area && (
            <>
              {" / "}
              <Link to={`/vocabulary/gazetteer/${area.gazetteer}`}>{area.gazetteer}</Link> /{" "}
              {area.id}
            </>
          )}
        </Text>
        {area ? (
          <AreaPage key={key} gazetteerName={area.gazetteer} id={area.id} />
        ) : (
          <Result
            status="404"
            title={`Unknown area ${key}`}
            subTitle="Areas are identified as gazetteer:id, for example iso:DE."
          />
        )}
      </PageContent>
    </Layout>
  );
};

export default AreaKey;
