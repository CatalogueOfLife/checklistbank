import React from "react";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../CatalogueSectors/SectorTabs";
import SyncTable from "./SyncTable";
import withContext from "../../../components/hoc/withContext";

class SectorSync extends React.Component {
  render() {
    const { catalogue } = this.props;
    return (
      <Layout
        selectedKeys={["catalogueSectors"]}
        openKeys={["assembly"]}
        title={catalogue ? catalogue.title : ""}
      >
        <PageContent>
          <SectorTabs />
        <SyncTable location={this.props.location} match={this.props.match} />
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({
  catalogue,
});
export default withContext(mapContextToProps)(withRouter(SectorSync));
