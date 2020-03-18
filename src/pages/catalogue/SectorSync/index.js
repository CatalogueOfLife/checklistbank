import React from "react";

import Layout from "../../../components/LayoutNew";
import SyncTable from "./SyncTable";
import withContext from "../../../components/hoc/withContext"


class SectorSync extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {catalogue} = this.props;
    return (
      <Layout
        selectedKeys={["sectorSync"]}
        openKeys={["assembly"]}
        title={catalogue ? catalogue.title : ''}
      >
        <SyncTable location={this.props.location} match={this.props.match}/>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({
  catalogue
});
export default withContext(mapContextToProps)(SectorSync);
