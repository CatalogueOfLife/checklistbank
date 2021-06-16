import React from "react";
import locales from "../csl/locales";
import styles from "../csl/styles";
const CSL = require("citeproc");
const processCsl = (source, styleKey = "zookeys") => {
  const references = { [source.id || "id"]: source };
  const citeprocSys = {
    retrieveLocale: function (lang) {
      return locales[lang];
    },
    retrieveItem: function (id) {
      return references[id]; //{ ...references[id].csl, id: id };
    },
  };

  const citeproc = new CSL.Engine(citeprocSys, styles[styleKey]);
  console.log(Object.keys(styles));
  citeproc.updateItems(Object.keys(references));
  const bibResult = citeproc.makeBibliography();
  return bibResult[1];
  //return Promise.resolve(bibResult[1].join("\n"));
};
const CitationPresentation = ({ csl }) =>
  csl ? (
    <div
      style={{ display: "inline-block" }}
      dangerouslySetInnerHTML={{ __html: processCsl({ id: "id", ...csl }) }}
    ></div>
  ) : (
    ""
  );

export default CitationPresentation;