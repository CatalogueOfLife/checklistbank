import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Result, Segmented, Spin, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import Linkify from "../../components/Linkify";
import config from "../../config";
import AreaMap from "./AreaMap";
import CompactList from "./CompactList";
import GazetteerImage from "./GazetteerImage";
import {
  GAZETTEERS_VIEWER,
  GAZETTEERS_WITH_IMAGE,
  MAX_LISTED_LABELS,
  areaPath,
  fetchOrNull,
  gazetteerFile,
  parseLabels,
} from "./gazetteers";

const { Paragraph, Text, Title } = Typography;

const BUILD_FAILED = "failed";

const ViewerLink = ({ children }) => (
  <a href={GAZETTEERS_VIEWER} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const NoMap = () => (
  <Alert
    type="info"
    showIcon
    style={{ marginBottom: "16px" }}
    title={
      <>
        There is no overview map for this gazetteer. You can explore its shapes in the{" "}
        <ViewerLink>gazetteer viewer</ViewerLink>.
      </>
    }
  />
);

const GazetteerPage = ({ name }) => {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [overview, setOverview] = useState();
  const [rows, setRows] = useState();
  const hasImage = GAZETTEERS_WITH_IMAGE.includes(name);
  const [image, setImage] = useState(hasImage ? undefined : null);
  const [view, setView] = useState("image");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const quietly = (promise, whenFailed = null) =>
      promise.catch((e) => {
        if (!signal.aborted) console.warn(e);
        return whenFailed;
      });

    Promise.all([
      quietly(fetchOrNull(`${config.dataApi}vocab/gazetteer/${encodeURIComponent(name)}`, { signal })),
      // null only if it isn't published, as a failed request says nothing about that
      quietly(fetchOrNull(gazetteerFile(name, "build.json"), { signal }), BUILD_FAILED),
    ]).then(([gazetteer, build]) => {
      if (signal.aborted) return;
      setState({ gazetteer, build });
      if (!build || build === BUILD_FAILED) return;
      if (hasImage) {
        quietly(fetchOrNull(gazetteerFile(name, "map.svg"), { as: "text", signal })).then(
          (svg) => signal.aborted || setImage(svg)
        );
      }
      // Skips the labels too large to list and the overview of a gazetteer
      // without shapes, which only exists for those that have shapes.
      setRows(null);
      setOverview(build.feature_count > 0 ? undefined : null);
      if (build.feature_count > 0) {
        quietly(fetchOrNull(gazetteerFile(name, "overview.geojson"), { signal })).then(
          (data) => signal.aborted || setOverview(data)
        );
      }
      if (build.label_count <= MAX_LISTED_LABELS) {
        setRows(undefined);
        quietly(fetchOrNull(gazetteerFile(name, "labels.tsv"), { as: "text", signal })).then(
          (tsv) => signal.aborted || setRows(tsv === null ? null : parseLabels(tsv))
        );
      }
    });
    return () => controller.abort();
  }, [name, hasImage]);

  const { loading, gazetteer, build } = state;
  const title = gazetteer?.title || name;
  const coverage = overview?.features?.[0]?.properties;
  const isCoverage = coverage?.coverage === true;
  const shown = coverage?.count?.toLocaleString("en");

  const overviewMap = () => (
    <>
      {overview === undefined && (
        <div style={{ height: 420, display: "grid", placeItems: "center" }}>
          <Spin />
        </div>
      )}
      {overview === null && <NoMap />}
      {overview && (
        <div style={{ marginBottom: "16px" }}>
          <AreaMap
            data={overview}
            fallback={<NoMap />}
            onAreaClick={(area) => navigate(areaPath(name, area.id))}
          />
          {isCoverage && (
            <Text type="secondary" style={{ display: "block", marginTop: "4px" }}>
              Where {coverage.omitted > 0 ? `${shown} of its` : `its ${shown}`} entries are,
              as grid cells of about 50 km and not the individual entries.
              {coverage.omitted > 0 &&
                ` The other ${coverage.omitted.toLocaleString("en")} are left out, as whole oceans would cover the map and survey grids would only draw their lattice.`}
            </Text>
          )}
        </div>
      )}
    </>
  );

  const content = () => {
    if (loading) return <Spin />;
    if (!gazetteer && !build) {
      return (
        <Result
          status="404"
          title="Unknown gazetteer"
          subTitle={<Link to="/vocabulary/gazetteer">All gazetteers</Link>}
        />
      );
    }
    return (
      <>
        {gazetteer?.description && <Paragraph>{gazetteer.description}</Paragraph>}
        {gazetteer?.link && (
          <Paragraph>
            <Linkify>{gazetteer.link}</Linkify>
          </Paragraph>
        )}
        {build === BUILD_FAILED ? (
          <Alert
            type="warning"
            showIcon
            title={
              <>
                The entries of this gazetteer could not be loaded. You can explore them in the{" "}
                <ViewerLink>gazetteer viewer</ViewerLink>.
              </>
            }
          />
        ) : !build ? (
          <Paragraph type="secondary">This gazetteer has no published entries.</Paragraph>
        ) : (
          <>
            {image && (
              <Segmented
                style={{ marginBottom: "8px" }}
                value={view}
                onChange={setView}
                options={[
                  { label: "World image", value: "image" },
                  { label: "Interactive map", value: "map" },
                ]}
              />
            )}
            {image === undefined && (
              <div style={{ height: 420, display: "grid", placeItems: "center" }}>
                <Spin />
              </div>
            )}
            {image && view === "image" && (
              <div style={{ marginBottom: "16px" }}>
                <GazetteerImage name={name} svg={image} fallback={overviewMap()} />
              </div>
            )}
            {image === null && overviewMap()}
            {image && view === "map" && overviewMap()}
            {name === "wdpa" && (
              <Paragraph>
                The licence of the World Database on Protected Areas does not allow its shapes to
                be redistributed.
              </Paragraph>
            )}
            {build.label_count > MAX_LISTED_LABELS ? (
              <Paragraph>
                Its {build.label_count.toLocaleString("en")} entries are too many to list here.
                You can search them in the <ViewerLink>gazetteer viewer</ViewerLink>.
              </Paragraph>
            ) : rows === undefined ? (
              <Spin />
            ) : rows === null ? (
              <Alert type="warning" showIcon title="The entries could not be loaded." />
            ) : (
              <CompactList
                rows={rows}
                linkTo={(row) => areaPath(name, row.id)}
              />
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Layout title={`Gazetteer: ${title}`} openKeys={["tools"]} selectedKeys={["vocabulary"]}>
      <PageContent>
        <Text type="secondary">
          <Link to="/vocabulary">Vocabularies</Link> /{" "}
          <Link to="/vocabulary/gazetteer">gazetteer</Link> / {name}
        </Text>
        <Title level={3} style={{ marginTop: "8px" }}>
          {title}{" "}
          <a
            href={`${config.dataApi}vocab/gazetteer/${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="API"
          >
            <ApiOutlined />
          </a>
        </Title>
        {content()}
      </PageContent>
    </Layout>
  );
};

// One gazetteer: its overview map and all of its entries.
const GazetteerKey = () => {
  const name = (useParams().name || "").toLowerCase();
  // remounted per gazetteer, so that nothing of the previous one carries over
  return <GazetteerPage key={name} name={name} />;
};

export default GazetteerKey;
