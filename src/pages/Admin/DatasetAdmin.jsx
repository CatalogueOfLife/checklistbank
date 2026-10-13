import { Tabs, Typography } from "antd";
import { useLocation } from "react-router-dom";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import history from "../../history";
import SearchIndexAdmin from "./SearchIndexAdmin";
import MatcherAdmin from "./MatcherAdmin";
import PlacementConflicts from "./PlacementConflicts";

const TABS = [
  {
    key: "index",
    label: "Search index",
    description:
      "Compares each dataset's number of name usages in Postgres with those in the Elasticsearch search index and the names matched to the names index, and lets you reindex, rematch, rebuild the matcher or reimport a single dataset.",
  },
  {
    key: "matcher",
    label: "Matcher",
    description:
      "Inspects the file based matcher of a dataset, shows whether it is stale compared to the latest import, and rebuilds it, or all stale or all matchers at once.",
  },
  {
    key: "placements",
    label: "Placement conflicts",
    description:
      "Lists public external datasets whose latest import placed a share of their accepted genera in a taxonomic group the reference checklists do not know them in.",
  },
];

const DatasetAdmin = () => {
  const location = useLocation();
  const activeKey = qs.parse(location.search)?.tab || "about";
  const onTabChange = (tab) =>
    history.push({
      pathname: location.pathname,
      search: tab === "about" ? "" : qs.stringify({ tab }),
    });

  const panes = {
    index: <SearchIndexAdmin location={location} />,
    matcher: <MatcherAdmin />,
    placements: <PlacementConflicts />,
  };

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["esAdmin"]}
      title="Dataset Admin"
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <Tabs
          activeKey={activeKey}
          onChange={onTabChange}
          items={[
            {
              key: "about",
              label: "Overview",
              children: (
                <>
                  <p>
                    Administrative tools to inspect and repair datasets across
                    the whole of ChecklistBank:
                  </p>
                  <dl>
                    {TABS.map((t) => (
                      <div key={t.key} style={{ marginBottom: 12 }}>
                        <dt>
                          <Typography.Link onClick={() => onTabChange(t.key)}>
                            {t.label}
                          </Typography.Link>
                        </dt>
                        <dd style={{ marginLeft: 0 }}>{t.description}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ),
            },
            ...TABS.map((t) => ({
              key: t.key,
              label: t.label,
              children: panes[t.key],
            })),
          ]}
        />
      </div>
    </Layout>
  );
};

export default DatasetAdmin;
