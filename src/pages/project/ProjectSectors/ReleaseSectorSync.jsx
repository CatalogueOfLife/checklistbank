import { useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Popover, Spin, Tooltip } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import config from "../../../config";
import { formatTime } from "../../../dateTime";

// The flat counters of a sync attempt (nameCount, taxonCount, ...), skipping
// zeros; the by-rank/by-status maps are left to the release metrics page.
const counts = (sync) =>
  Object.entries(sync || {}).filter(
    ([key, value]) => key.endsWith("Count") && typeof value === "number" && value > 0
  );

const SyncSummary = ({ releaseKey, sectorKey, sync, error }) => (
  <div style={{ maxWidth: 320 }}>
    {error && <div>No sync stored with this release.</div>}
    {sync && (
      <>
        <div>
          Sync #{sync.attempt}, {formatTime(sync.finished || sync.started, "lll")}
        </div>
        {sync.datasetAttempt && <div>Source import #{sync.datasetAttempt}</div>}
        <table style={{ margin: "8px 0" }}>
          <tbody>
            {counts(sync).map(([key, value]) => (
              <tr key={key}>
                <td style={{ paddingRight: 12 }}>{key}</td>
                <td style={{ textAlign: "right" }}>{value.toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}
    <NavLink to={{ pathname: `/dataset/${releaseKey}/names`, search: `?sectorKey=${sectorKey}` }}>
      Names of this sector in the release
    </NavLink>
  </div>
);

// Release counterpart of the project's sync history link: a release stores the
// one sync of each sector that went into it, so show that instead of linking
// to the project's live history.
const ReleaseSectorSync = ({ releaseKey, sectorKey }) => {
  const [sync, setSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = (open) => {
    if (!open || sync || loading) return;
    setLoading(true);
    axios(`${config.dataApi}dataset/${releaseKey}/sector/${sectorKey}/sync`)
      .then((res) => setSync(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  return (
    <Popover
      trigger="click"
      title="Sector sync in this release"
      onOpenChange={load}
      content={
        loading ? (
          <Spin size="small" />
        ) : (
          <SyncSummary releaseKey={releaseKey} sectorKey={sectorKey} sync={sync} error={error} />
        )
      }
    >
      <Tooltip title="Sync">
        <a>
          <HistoryOutlined style={{ fontSize: "20px" }} />{"  "}
        </a>
      </Tooltip>
    </Popover>
  );
};

export default ReleaseSectorSync;
