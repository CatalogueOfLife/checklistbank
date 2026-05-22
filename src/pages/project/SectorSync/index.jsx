import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import SyncTable from "./SyncTable";
import withContext from "../../../components/hoc/withContext";

const SectorSync = ({ catalogue, location, match }) => (
  <Layout
    selectedKeys={["catalogueSectors"]}
    openKeys={["assembly"]}
    title={catalogue ? catalogue.title : ""}
  >
    <PageContent>
      <SectorTabs />
      <SyncTable location={location} match={match} />
    </PageContent>
  </Layout>
);

const mapContextToProps = ({ catalogue }) => ({
  catalogue,
});
export default withContext(mapContextToProps)(withRouter(SectorSync));
