import React from "react";
import Layout from "../../components/LayoutNew";
import MetaDataForm from "../../components/MetaDataForm";
import history from "../../history";
import PageContent from '../../components/PageContent'


class DatasetCreate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Layout 
        openKeys={["dataset"]}
        selectedKeys={["datasetCreate"]} title="New Dataset">
        
        <PageContent>
          
        <MetaDataForm
          onSaveSuccess={(res) => {
            history.push(`/dataset/${res.data}/meta`);
          }}
        />
        </PageContent>
      </Layout>
    );
  }
}

export default DatasetCreate;
