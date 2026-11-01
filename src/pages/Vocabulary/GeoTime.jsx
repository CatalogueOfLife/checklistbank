import React, { useEffect, useRef, useState } from "react";
import { Alert, Spin, Tabs, Typography } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import config from "../../config";
import GeoTimeScale from "./GeoTimeScale";
import { anchorName } from "./TaxGroupTree";
import { ValueCard, ValueFields, ValueList } from "./ValueCard";

const VIEWS = ["scale", "cards"];

// The geotime vocabulary, shown either as a coloured time scale or as the cards of any
// other vocabulary. The view is kept in ?view= and the selected time span in the anchor,
// so links to a time span work in both views.
const GeoTime = ({ location, navigate }) => {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const container = useRef(null);
  // Set when a time span got selected by a click, as it is in view already.
  const suppressScroll = useRef(false);
  const view = new URLSearchParams(location.search).get("view");
  const activeView = VIEWS.includes(view) ? view : VIEWS[0];
  const anchor = anchorName(location);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${config.dataApi}vocab/geotime`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} for vocabulary geotime`);
        return response.json();
      })
      .then(setItems)
      .catch((e) => {
        if (controller.signal.aborted) return;
        console.warn(e);
        setFailed(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (suppressScroll.current || !anchor || !items) {
      suppressScroll.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => {
      const el = [...(container.current?.querySelectorAll("[id]") || [])].find(
        (e) => e.id === anchor
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [anchor, items, activeView]);

  const onViewChange = (key) => {
    const params = new URLSearchParams(location.search);
    params.set("view", key);
    navigate(
      { pathname: location.pathname, search: `?${params}`, hash: location.hash },
      { replace: true }
    );
  };

  return (
    <Layout title="Vocabulary: geotime" openKeys={["tools"]} selectedKeys={["vocabulary"]}>
      <PageContent>
        <div ref={container} style={{ marginTop: "10px" }}>
          {failed && (
            <Alert type="warning" showIcon title="The vocabulary geotime could not be loaded." />
          )}
          {!failed && !items && <Spin />}
          {items && (
            <Tabs
              activeKey={activeView}
              onChange={onViewChange}
              // remount on switch so the view scrolls to the anchored time span
              destroyOnHidden
              items={[
                {
                  key: "scale",
                  label: "Scale",
                  children: (
                    <>
                      <Typography.Paragraph type="secondary">
                        The youngest time spans come first and ages are in millions of years.
                        Rows do not show the length of a time span. Colours are a lighter version
                        of those of the{" "}
                        <a href="https://stratigraphy.org/chart">
                          International Chronostratigraphic Chart
                        </a>
                        .
                      </Typography.Paragraph>
                      <GeoTimeScale
                        items={items}
                        location={location}
                        selected={anchor}
                        onSelect={() => {
                          suppressScroll.current = true;
                        }}
                      />
                    </>
                  ),
                },
                {
                  key: "cards",
                  label: "Cards",
                  children: (
                    <ValueList>
                      {items.map((item) => (
                        <ValueCard key={item.name} id={item.name} heading={item.name}>
                          <ValueFields item={item} />
                        </ValueCard>
                      ))}
                    </ValueList>
                  ),
                },
              ]}
            />
          )}
        </div>
      </PageContent>
    </Layout>
  );
};

export default withRouter(GeoTime);
