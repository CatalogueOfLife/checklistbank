import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import installTranslationCrashGuard from "./installTranslationCrashGuard";

// Match moment's broader API surface — `.fromNow()` and `dayjs.utc()` are
// referenced across the codebase (e.g. SyncState). LocalizedFormat enables
// the `l`, `LT`, `LL`, `LLL`, … tokens used by older `.format(...)` calls.
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(localizedFormat);

// Stop browser page-translation from crashing React's reconciler. Must run
// before the app renders. See installTranslationCrashGuard for the full why.
installTranslationCrashGuard();

// Plausible analytics is only enabled on the public production host.
// Lives here rather than as an inline <script> in index.html so the
// dev site's CSP (which blocks unsafe-inline) doesn't refuse it.
if (window.location.hostname === "www.checklistbank.org") {
  const s = document.createElement("script");
  s.defer = true;
  s.setAttribute("data-domain", "checklistbank.org");
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}

const root = createRoot(document.getElementById("root"));
root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
