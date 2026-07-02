import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Input, Button, Spin, Empty } from "antd";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import config from "../../config";
import { publisherOptionLabel } from "../../components/publisherOption";

// Custom Table filterDropdown for the Publisher column. Renders a debounced
// type-ahead against the CLB `dataset/publishers` suggest endpoint and lists the
// results inline in the filter popover (no nested AutoComplete overlay). Uses the
// authenticated axios so logged-in users also see their private-dataset publishers.
// Selecting a row applies the publisher name via antd's setSelectedKeys/confirm,
// which flows through handleTableChange -> buildSearchQuery -> ?publisher=<name>.
const PublisherFilterDropdown = ({
  setSelectedKeys,
  confirm,
  currentValue,
}) => {
  const [query, setQuery] = useState(currentValue || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(null);

  useEffect(() => {
    const fn = debounce((q) => {
      if (!q) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      axios(
        `${config.dataApi}dataset/publishers?q=${encodeURIComponent(q)}&limit=25`
      )
        .then((res) => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    fetchRef.current = fn;
    return () => fn.cancel();
  }, []);

  useEffect(() => {
    if (fetchRef.current) fetchRef.current(query);
  }, [query]);

  const apply = (name) => {
    setSelectedKeys(name ? [name] : []);
    confirm();
  };

  return (
    <div style={{ padding: 8, width: 280 }}>
      <Input
        autoFocus
        allowClear
        placeholder="Filter by publisher"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPressEnter={() => results[0] && apply(results[0].key)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 12 }}>
            <Spin size="small" />
          </div>
        ) : results.length ? (
          results.map((o) => (
            <div
              key={o.key}
              onClick={() => apply(o.key)}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                borderRadius: 4,
                background: o.key === currentValue ? "#e6f4ff" : undefined,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  o.key === currentValue ? "#e6f4ff" : "")
              }
            >
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={(query || "").split(" ")}
                autoEscape
                textToHighlight={publisherOptionLabel(o)}
              />
            </div>
          ))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={query ? "No publishers" : "Type to search"}
            style={{ margin: "12px 0" }}
          />
        )}
      </div>
      <div style={{ textAlign: "right", marginTop: 8 }}>
        <Button
          size="small"
          type="link"
          onClick={() => {
            setQuery("");
            apply("");
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default PublisherFilterDropdown;
