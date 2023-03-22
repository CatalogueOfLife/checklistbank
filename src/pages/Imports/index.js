import React, { useEffect } from "react";

import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import ImportTable from "./importTabs/ImportTable";
import withContext from "../../components/hoc/withContext";

const _ = require("lodash");

const Imports = ({ section, importState, location }) => {

  useEffect(() => { }, [importState])
  return (
    <Layout
      openKeys={[]}
      selectedKeys={["backgroundImports"]}
      title={`Imports`}
    >
      <PageContent>
        {importState.length > 0 && <ImportTable
          importState={importState
            .filter(
              (i) =>
                i.running === true ||
                i.queued === true
            )
            .map((i) => i.name)}
          section={"running"}
          location={location}
        />}

        {importState.length > 0 && <ImportTable
          importState={importState
            .filter(
              (i) =>
                i.finished === true
            )
            .map((i) => i.name)}
          section={"finished"}
          location={location}
        />}
      </PageContent>


      {/* {section === "running" && (
          <ImportTable
            importState={importState
              .filter(
                (i) =>
                  i.running === true ||
                  i.queued === true
              )
              .map((i) => i.name)}
            section={section}
            location={location}
          />
        )}
        {section === "finished" && (
          <ImportTable
            importState={importState
              .filter(
                (i) =>
                  i.finished === true
              )
              .map((i) => i.name)}
            section={section}
            location={location}
          />
        )} */}
    </Layout>
  );
}


const mapContextToProps = ({ user, importState }) => ({ user, importState });
export default withContext(mapContextToProps)(Imports);
