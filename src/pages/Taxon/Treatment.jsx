import React from "react";
import DOMPurify from "dompurify";
import marked from "marked";

// Sanitize HTML treatments so no head, css or js can be injected — only plain,
// basic HTML body tags survive. DOMPurify already strips <script> and on* event
// handlers by default; we additionally forbid styling and document-head tags.
const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "link", "meta", "head", "title", "base"],
    FORBID_ATTR: ["style"],
  });

const Treatment = ({ treatment }) => {
  if (!treatment?.document) {
    return null;
  }

  const { format, document } = treatment;

  switch (format) {
    case "html":
      return (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(document) }}
        />
      );
    case "markdown":
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(marked(document)),
          }}
        />
      );
    default:
      // plain text, xml, tax pub, taxon x, rdf, pdf … — render verbatim
      return (
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {document}
        </pre>
      );
  }
};

export default Treatment;
