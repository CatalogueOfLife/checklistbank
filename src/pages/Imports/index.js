import React from "react";

import Layout from "../../components/LayoutNew";
import ImportTable from "./importTabs/ImportTable";
import withContext from "../../components/hoc/withContext";

const _ = require("lodash");

class Imports extends React.Component {
  render() {
    const { section, importState, location } = this.props;

    return (
      <Layout
        openKeys={["imports"]}
        selectedKeys={[section]}
        title={`${_.startCase(section)} imports`}
      >
        {section === "running" && (
          <ImportTable
            importState={importState
              .filter(
                (i) =>
                  i.running === "true" ||
                  i.running === true ||
                  i.name === "waiting"
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
                  i.running === "false" ||
                  (i.running === false && i.name !== "waiting")
              )
              .map((i) => i.name)}
            section={section}
            location={location}
          />
        )}
      </Layout>
    );
  }
}

const mapContextToProps = ({ user, importState }) => ({ user, importState });
export default withContext(mapContextToProps)(Imports);
