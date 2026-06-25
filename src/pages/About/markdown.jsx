import React from "react";

import marked from "marked";
import DOMPurify from "dompurify";

// GitHub-style "link" octicon used for the heading gutter anchors
const ANCHOR_ICON =
  '<svg class="md-anchor-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<path fill="currentColor" d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"></path>' +
  "</svg>";

// marked renders heading text to HTML, so entities like & become &amp;. The
// heading itself decodes them via dangerouslySetInnerHTML, but the TOC renders
// the label as plain JSX text - decode it so it does not show the raw entity.
const decodeEntities = (str) => {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
};

// Render the markdown, giving every heading a stable id + a gutter anchor link,
// and collect the headings so we can build a table of contents.
export const renderMarkdown = (md) => {
  if (!md) return { html: "", headings: [] };
  const headings = [];
  const slugger = new marked.Slugger();
  const renderer = new marked.Renderer();
  renderer.heading = (text, level, raw) => {
    const slug = slugger.slug(raw);
    headings.push({
      slug,
      level,
      label: decodeEntities(text.replace(/<[^>]+>/g, "")),
    });
    return (
      `<h${level} id="${slug}">` +
      `<a class="md-anchor" href="#${slug}" aria-label="Permalink to this section">${ANCHOR_ICON}</a>` +
      `${text}</h${level}>`
    );
  };
  const html = DOMPurify.sanitize(marked(md, { renderer }));
  return { html, headings };
};

export const TableOfContents = ({ headings }) => {
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
