import React from "react";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../CatalogueSectors/SectorTabs";
import withContext from "../../../components/hoc/withContext";
import Publishers from "../Options/Publishers";
class SectorPublishers extends React.Component {
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
          <Publishers />
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({
  catalogue,
});
export default withContext(mapContextToProps)(withRouter(SectorPublishers));
