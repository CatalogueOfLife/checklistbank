import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spin } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import CompactList from "./CompactList";
import { anchorName } from "./TaxGroupTree";
import { ValueCard, ValueFields, ValueList } from "./ValueCard";
import { areaPath } from "./gazetteers";
import { normalizeVocab, vocabApiPath } from "./vocabValues";

const heading = (item) =>
  // e.g. a country, which is an area of the iso gazetteer
  item.gazetteer && item.id ? (
    <Link to={areaPath(item.gazetteer, item.id)}>{item.name}</Link>
  ) : (
    item.name
  );

const VocabularyKey = ({
  location,
  match: {
    params: { key },
  },
}) => {
  const [vocab, setVocab] = useState(null);
  const [failed, setFailed] = useState(false);
  const container = useRef(null);
  const anchor = anchorName(location);

  useEffect(() => {
    const controller = new AbortController();
    setVocab(null);
    setFailed(false);
    fetch(`${config.dataApi}vocab/${vocabApiPath(key)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} for vocabulary ${key}`);
        return response.json();
      })
      .then((data) => setVocab(normalizeVocab(data)))
      .catch((e) => {
        if (controller.signal.aborted) return;
        console.warn(e);
        setFailed(true);
      });
    return () => controller.abort();
  }, [key]);

  // The cards only exist once loaded, too late for the browser to find an anchor.
  useEffect(() => {
    if (!anchor || !vocab?.items) return;
    const raf = requestAnimationFrame(() => {
      const el = [...(container.current?.querySelectorAll("section[id]") || [])].find(
        (e) => e.id === anchor
      );
      el?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [anchor, vocab]);

  return (
    <Layout
      title={`Vocabulary: ${key}`}
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <div ref={container} style={{ marginTop: "10px" }}>
          {failed && (
            <Alert type="warning" showIcon title={`The vocabulary ${key} could not be loaded.`} />
          )}
          {!failed && !vocab && <Spin />}
          {vocab?.rows && <CompactList rows={vocab.rows} />}
          {vocab?.items && (
            <ValueList>
              {vocab.items.map((item) => (
                <ValueCard key={item.name} id={item.name} heading={heading(item)}>
                  <ValueFields item={item} />
                </ValueCard>
              ))}
            </ValueList>
          )}
        </div>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = () => ({});
export default withContext(mapContextToProps)(withRouter(VocabularyKey));
