import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

import withRouter from "../../withRouter";
import config from "../../config";
import PageContent from "../../components/PageContent";

import Layout from "../../components/LayoutNew";

import { renderMarkdown, TableOfContents } from "./markdown";
import IdentifierScopeTable from "./IdentifierScopeTable";

import "./About.css";

// About page on scoped CURIE identifiers. The prose lives in the markdown file
// (editable like the other About pages) while the live, expandable registry of
// all scopes is rendered by IdentifierScopeTable below the text.
const Identifiers = ({ location }) => {
  const [md, setMd] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios(`/about-md/identifiers.md`).then((r) => r.data);
        setMd(
          res
            .replaceAll("{{GBIF_URL}}", config.gbifUrl)
            .replaceAll("{{API}}", config.dataApi.replace(/\/$/, ""))
        );
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  const { html, headings } = useMemo(() => renderMarkdown(md), [md]);

  // the markdown loads asynchronously, so a #hash in the URL is not resolved by
  // the browser on first load - scroll to it ourselves once the content is in
  useEffect(() => {
    if (!html || !location?.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
    }
  }, [html, location?.hash]);

  return (
    <Layout
      openKeys={["about"]}
      selectedKeys={["identifiers"]}
      title="About - Identifiers"
    >
      <PageContent>
        {headings.length > 1 && <TableOfContents headings={headings} />}
        <div
          className="md-content"
          dangerouslySetInnerHTML={{ __html: html }}
        ></div>
        <IdentifierScopeTable />
      </PageContent>
    </Layout>
  );
};

export default withRouter(Identifiers);
