import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import withContext from "../../../components/hoc/withContext";
import Publishers from "../Options/Publishers";

const SectorPublishers = ({ catalogue }) => {
  return (
    <Layout
      selectedKeys={["catalogueSectors"]}
      openKeys={["assembly"]}
      title={catalogue ? catalogue.title : ""}
    >
      <PageContent>
        <SectorTabs />
        <Publishers />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogue }) => ({
  catalogue,
});
export default withContext(mapContextToProps)(withRouter(SectorPublishers));
