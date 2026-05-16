import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import { unregister } from "./registerServiceWorker";

// Match moment's broader API surface — `.fromNow()` and `dayjs.utc()` are
// referenced across the codebase (e.g. SyncState).
dayjs.extend(relativeTime);
dayjs.extend(utc);

const root = createRoot(document.getElementById("root"));
root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Clear any stale CRA-era service-worker registration.
unregister();
