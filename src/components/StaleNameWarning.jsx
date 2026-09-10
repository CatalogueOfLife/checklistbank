import React, { useState } from "react";
import { Popover } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import axios from "axios";
import config from "../config";

// A sector link whose id still resolves, but to a usage carrying a different name than the one
// stored on the sector - the sector silently points somewhere else than it claims. Distinct from
// `broken` (red), where the id resolves to nothing at all, so this gets its own amber icon.
const StaleNameWarning = ({ datasetKey, id, storedName }) => {
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // resolved lazily: the list payload only carries the flag, not the current name
  const resolve = (open) => {
    if (!open || current || loading) return;
    setLoading(true);
    setError(false);
    axios(
      `${config.dataApi}dataset/${datasetKey}/nameusage/${encodeURIComponent(id)}`
    )
      .then((res) => {
        setLoading(false);
        setCurrent(res.data);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  return (
    <Popover
      onOpenChange={resolve}
      title="The stored name is out of date"
      content={
        <div style={{ maxWidth: "320px" }}>
          <div>
            <strong>Stored on the sector:</strong> {storedName}
          </div>
          <div>
            <strong>Id {id} now resolves to:</strong>{" "}
            {loading && "Loading..."}
            {error && "could not be resolved"}
            {current && (
              <NavLink
                to={`/dataset/${datasetKey}/taxon/${encodeURIComponent(id)}`}
                dangerouslySetInnerHTML={{ __html: current.labelHtml }}
              />
            )}
          </div>
          <div style={{ marginTop: "8px" }}>
            Rematch the sector to point it at the name it claims, or update the
            sector to the name it actually resolves to.
          </div>
        </div>
      }
    >
      <ExclamationCircleOutlined
        style={{ color: "#fa8c16", marginLeft: "10px" }}
      />
    </Popover>
  );
};

export default StaleNameWarning;
