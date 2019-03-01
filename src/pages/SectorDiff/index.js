import React from "react";

import Layout from "../../components/LayoutNew";
import config from "../../config";
import {Diff2Html} from "diff2html"
import "diff2html/dist/diff2html.min.css";
import PageContent from '../../components/PageContent'

const {MANAGEMENT_CLASSIFICATION} = config

const _ = require("lodash");

class SectorDiff extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {

    const diff = `--- sector1 attempt0
+++ sector1 attempt1
@@ -1,7 +1,6 @@
 Plantae [kingdom]
   *Viridae [kingdom]
   Asteraceae [family]
-    *Compositae [family]
     Cichorioideae [subfamily]
       Cichorieae [tribe]
         Crepis L. [genus]
@@ -12,12 +11,12 @@
           Crepis occidentalis Nutt. [species]
         Leontodon [genus]
           Leontodon anomalus [species]
+          Leontodon saxatilis [species]
           Leontodon taraxacoides (Vill.) Mérat [species]
             *$Leonida taraxacoida Vill. [species]
             *Leontodon leysseri [species]
-            *Leontodon saxatilis [species]
       Gundelieae [tribe]
-        Gundelia L. [genus]
+        Gundelia [genus]
           Gundelia rosea L. [species]
           Gundelia tournefortii L. [species]
       Platycarpha [genus]`.replace(`
       `, "\n")

    const html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: true,
        matching: "lines",
        outputFormat: "side-by-side"
      })

    return (
      <Layout selectedKeys={["sectorSync"]} openKeys={["assembly"]} title={MANAGEMENT_CLASSIFICATION.title}>
              <PageContent>
                <div dangerouslySetInnerHTML={{__html: html}}></div>
        
        </PageContent>

      </Layout>
    );
  }
}

export default SectorDiff;
