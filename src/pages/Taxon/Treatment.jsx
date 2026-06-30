import React from "react";
import DOMPurify from "dompurify";
import marked from "marked";
import linkify from "linkify-html";

// Sanitize HTML treatments so no head, css or js can be injected — only plain,
// basic HTML body tags survive. DOMPurify already strips <script> and on* event
// handlers by default; we additionally forbid styling and document-head tags.
const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "link", "meta", "head", "title", "base"],
    FORBID_ATTR: ["style"],
  });

const renderDocument = ({ format, document }) => {
  switch (format) {
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(document) }} />;
    case "markdown":
      return (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked(document)) }}
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

// The citation shown above a treatment: prefer the single source's citation when
// the dataset has exactly one source, otherwise the dataset's own citation.
const getCitation = (dataset) => {
  const sources = Array.isArray(dataset?.source) ? dataset.source : [];
  if (sources.length === 1 && sources[0]?.citation) {
    return sources[0].citation;
  }
  return dataset?.citation || null;
};

const Treatment = ({ treatment, dataset }) => {
  if (!treatment?.document) {
    return null;
  }

  const citation = getCitation(dataset);

  return (
    <>
      {citation && (
        <fieldset
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            background: "#fafafa",
            padding: "8px 16px 12px",
            margin: "0 0 16px",
            color: "rgba(0, 0, 0, 0.65)",
          }}
        >
          <legend
            style={{
              width: "auto",
              padding: "0 8px",
              margin: 0,
              border: "none",
              fontWeight: 600,
              fontSize: "medium",
            }}
          >
            In Article
          </legend>
          <span dangerouslySetInnerHTML={{ __html: linkify(citation) }} />
        </fieldset>
      )}
      {renderDocument(treatment)}
    </>
  );
};

export default Treatment;
