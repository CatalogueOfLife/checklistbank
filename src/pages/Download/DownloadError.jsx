import React from "react";
import { Alert } from "antd";
import PresentationItem from "../../components/PresentationItem";

// Why a download failed, the reason the failure email gives as well.
// Request errors come as one sentence, but other errors keep the first message
// of the exception, which for a database error includes its whole SQL. So the
// text wraps and scrolls inside the box instead of stretching the card.
const DownloadError = ({ error, md }) => {
  const text = typeof error === "string" ? error.trim() : null;
  if (!text) return null;
  return (
    <PresentationItem md={md} label="Error">
      <Alert
        type="error"
        title={
          <div
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "12em",
              overflowY: "auto",
            }}
          >
            {text}
          </div>
        }
      />
    </PresentationItem>
  );
};

export default DownloadError;
