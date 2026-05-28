import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import SyncTable from "./SyncTable";
import withContext from "../../../components/hoc/withContext";

const SectorSync = ({ project, location, match }) => (
  <Layout
    selectedKeys={["projectSectors"]}
    openKeys={["assembly"]}
    title={project ? project.title : ""}
  >
    <PageContent>
      <SectorTabs />
      <SyncTable location={location} match={match} />
    </PageContent>
  </Layout>
);

const mapContextToProps = ({ project }) => ({
  project,
});
export default withContext(mapContextToProps)(withRouter(SectorSync));
