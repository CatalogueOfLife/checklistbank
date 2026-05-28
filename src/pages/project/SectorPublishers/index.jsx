import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import withContext from "../../../components/hoc/withContext";
import Publishers from "../Options/Publishers";

const SectorPublishers = ({ project }) => {
  return (
    <Layout
      selectedKeys={["projectSectors"]}
      openKeys={["assembly"]}
      title={project ? project.title : ""}
    >
      <PageContent>
        <SectorTabs />
        <Publishers />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ project }) => ({
  project,
});
export default withContext(mapContextToProps)(withRouter(SectorPublishers));
