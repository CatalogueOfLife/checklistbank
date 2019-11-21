import React from "react";

import Layout from "../../components/LayoutNew";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";


import ErrorMsg from "../../components/ErrorMsg";
import PageContent from "../../components/PageContent";
import NameSearch from "../NameSearch"

const { NAME_INDEX } = config;

class NameIndex extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      
    };
  }
  

  render() {
    const {
      
    } = this.state;

    return (
      <Layout openKeys={["dataset"]} selectedKeys={['nameIndex']} title="Catalogue of Life + Name Index">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Catalogue of Life + Name Index</title>
          <link rel="canonical" href="http://data.catalogue.life" />
        </Helmet>
        <PageContent>
            <NameSearch location={this.props.location} datasetKey={NAME_INDEX.key}/>
        </PageContent>
      </Layout>
    );
  }
}

export default NameIndex;
