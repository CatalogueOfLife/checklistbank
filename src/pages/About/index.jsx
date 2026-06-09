import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

import withRouter from "../../withRouter";
import PageContent from "../../components/PageContent";

import Layout from "../../components/LayoutNew";

import marked from "marked";
import DOMPurify from "dompurify";

import "./About.css";

// GitHub-style "link" octicon used for the heading gutter anchors
const ANCHOR_ICON =
  '<svg class="md-anchor-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<path fill="currentColor" d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"></path>' +
  "</svg>";

// Render the markdown, giving every heading a stable id + a gutter anchor link,
// and collect the headings so we can build a table of contents.
const renderMarkdown = (md) => {
  if (!md) return { html: "", headings: [] };
  const headings = [];
  const slugger = new marked.Slugger();
  const renderer = new marked.Renderer();
  renderer.heading = (text, level, raw) => {
    const slug = slugger.slug(raw);
    headings.push({ slug, level, label: text.replace(/<[^>]+>/g, "") });
    return (
      `<h${level} id="${slug}">` +
      `<a class="md-anchor" href="#${slug}" aria-label="Permalink to this section">${ANCHOR_ICON}</a>` +
      `${text}</h${level}>`
    );
  };
  const html = DOMPurify.sanitize(marked(md, { renderer }));
  return { html, headings };
};

const TableOfContents = ({ headings }) => {
  const minLevel = Math.min(...headings.map((h) => h.level));
  return (
    <nav className="md-toc" aria-label="Table of contents">
      <div className="md-toc-title">Contents</div>
      <ul>
        {headings.map((h) => (
          <li
            key={h.slug}
            style={{ marginLeft: `${(h.level - minLevel) * 16}px` }}
          >
            <a href={`#${h.slug}`}>{h.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const About = ({
  match: {
    params: { mdFile },
  },
  location,
}) => {
  const [md, setMd] = useState(null);

  useEffect(() => {
    if (mdFile) {
      getData();
    }
  }, [mdFile]);

  const getData = async () => {
    try {
      const res = await axios(`/about-md/${mdFile}.md`).then((res) => res.data);
      setMd(res);
    } catch (error) {
      console.log(error);
    }
  };

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
      selectedKeys={[mdFile]}
      title={`About - ${mdFile}`}
    >
      <PageContent>
        {headings.length > 1 && <TableOfContents headings={headings} />}
        <div
          className="md-content"
          dangerouslySetInnerHTML={{ __html: html }}
        ></div>
      </PageContent>
    </Layout>
  );
};

export default withRouter(About);
