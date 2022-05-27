import React from "react";
import Layout from "../../components/LayoutNew";
import MetaDataForm from "../../components/MetaData/MetaDataForm";
import history from "../../history";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import Exception403 from "../../components/exception/403";
import Auth from "../../components/Auth";
class DatasetCreate extends React.Component {
  render() {
    return (
      <Layout
        openKeys={["dataset"]}
        selectedKeys={["datasetCreate"]}
        title="New Dataset"
      >
       {Auth.isEditorOrAdmin(this.props.user) ? <PageContent>
          <MetaDataForm
            onSaveSuccess={(res, origin) => {
              if(origin === "external"){
                history.push(`/dataset/${res.data}/options`)
              } else {
                history.push(`/dataset/${res.data}/about`)
              }
              ;
            }}
          />
        </PageContent> : <Exception403 />}
      </Layout>
    );
  }
}

const mapContextToProps = ({  user }) => ({  user });

export default withContext(mapContextToProps)(DatasetCreate);
