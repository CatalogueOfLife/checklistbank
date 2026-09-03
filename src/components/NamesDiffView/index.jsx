import { useState } from "react";
import { Alert, Segmented, Collapse, Empty, Button } from "antd";
import DiffStats from "./DiffStats";
import ChangedNameRow from "./ChangedNameRow";
import { mergeSorted, cappedAt } from "./diffRows";
import "./NamesDiffView.css";

const ROW_CAP = 500;

// A dismissed Alert keeps its closed state for as long as it stays mounted, so
// key it on the diff to make the warning come back for the next comparison.
const TruncationWarning = ({ diff }) => (
  <Alert
    type="warning"
    showIcon
    closable
    style={{ marginBottom: "8px" }}
    title="Incomplete diff — differences are missing"
    description={
      <>
        The server caps each list at{" "}
        <strong>{cappedAt(diff).toLocaleString()} entries</strong> to bound
        memory use, and this comparison hit that cap. The removed, added and
        changed lists below are cut off and their counts are lower bounds — the
        real number of differences is higher. Compare a smaller slice (a root
        taxon, or a higher lowest rank) to get a complete diff.
      </>
    }
  />
);

// Render at most ROW_CAP items, with a "Show all N" toggle for the remainder.
const CappedList = ({ items, renderItem }) => {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, ROW_CAP);
  return (
    <>
      {shown.map(renderItem)}
      {!showAll && items.length > ROW_CAP && (
        <Button
          type="link"
          className="namesdiff-showall"
          onClick={() => setShowAll(true)}
        >
          Show all {items.length}
        </Button>
      )}
    </>
  );
};

const plainRow = (type, prefix) => (name, i) => (
  <div key={`${type}${i}`} className={`namesdiff-row namesdiff-${type}`}>
    <span className="namesdiff-prefix">{prefix}</span>
    {name}
  </div>
);

const changedRow = (changed, key) => (
  <div key={key} className="namesdiff-row namesdiff-changed">
    <span className="namesdiff-prefix">~</span>
    <ChangedNameRow
      chunks={changed.chunks}
      before={changed.before}
      after={changed.after}
    />
  </div>
);

const NamesDiffView = ({ diff, defaultView = "grouped" }) => {
  const [view, setView] = useState(defaultView);
  if (!diff) return null;

  const removed = diff.removed || [];
  const added = diff.added || [];
  const changed = diff.changed || [];
  const identical =
    diff.identical ??
    (removed.length === 0 && added.length === 0 && changed.length === 0);

  if (identical) return <Empty description="No differences" />;

  const groupedItems = [
    removed.length > 0 && {
      key: "removed",
      label: `Removed (${removed.length})`,
      children: <CappedList items={removed} renderItem={plainRow("removed", "−")} />,
    },
    added.length > 0 && {
      key: "added",
      label: `Added (${added.length})`,
      children: <CappedList items={added} renderItem={plainRow("added", "+")} />,
    },
    changed.length > 0 && {
      key: "changed",
      label: `Changed (${changed.length})`,
      children: (
        <CappedList
          items={changed}
          renderItem={(c, i) => changedRow(c, `c${i}`)}
        />
      ),
    },
  ].filter(Boolean);

  const sortedRows = mergeSorted(diff);
  const renderSortedRow = (row) =>
    row.type === "changed"
      ? changedRow(row.value, row.key)
      : plainRow(row.type, row.type === "removed" ? "−" : "+")(row.value, row.key);

  return (
    <div className="namesdiff">
      {diff.truncated && (
        <TruncationWarning
          key={`${diff.label1}|${diff.label2}|${removed.length}|${added.length}|${changed.length}`}
          diff={diff}
        />
      )}
      <DiffStats diff={diff} />
      <Segmented
        style={{ margin: "8px 0" }}
        value={view}
        onChange={setView}
        options={[
          { label: "Grouped", value: "grouped" },
          { label: "Sorted", value: "sorted" },
        ]}
      />
      {view === "grouped" ? (
        <Collapse
          defaultActiveKey={groupedItems.map((i) => i.key)}
          items={groupedItems}
        />
      ) : (
        <CappedList items={sortedRows} renderItem={renderSortedRow} />
      )}
    </div>
  );
};

export default NamesDiffView;
