import React from "react";
import Layout from "../../components/LayoutNew";
import MetaDataForm from "../../components/MetaData/MetaDataForm";
import history from "../../history";
import PageContent from "../../components/PageContent";
import withContext from "../../components/hoc/withContext";
import Exception403 from "../../components/exception/403";
import Auth from "../../components/Auth";

const DatasetCreate = ({ user, loadTokenUser, addError }) => (
  <Layout
    openKeys={["dataset"]}
    selectedKeys={["datasetCreate"]}
    title="New Dataset"
  >
    {Auth.isEditorOrAdmin(user) || user?.editor?.length > 0 ? (
      <PageContent>
        <MetaDataForm
          onSaveSuccess={async (res, origin) => {
            try {
              await loadTokenUser();
              if (origin === "external") {
                history.push(`/dataset/${res.data}/options`);
              } else {
                history.push(`/catalogue/${res.data}/metadata`);
              }
            } catch (error) {
              addError(error);
            }
          }}
        />
      </PageContent>
    ) : (
      <Exception403 />
    )}
  </Layout>
);

/* class DatasetCreate extends React.Component {
  render() {
    return (
      <Layout
        openKeys={["dataset"]}
        selectedKeys={["datasetCreate"]}
        title="New Dataset"
      >
        {Auth.isEditorOrAdmin(this.props.user) ? <PageContent>
          <MetaDataForm
            onSaveSuccess={async (res, origin) => {
              try {
                await loadTokenUser()
                if (origin === "external") {
                  history.push(`/dataset/${res.data}/options`)
                } else {
                  history.push(`/dataset/${res.data}/about`)
                }
              } catch (error) {
                addError(error)
              }

              ;
            }}
          />
        </PageContent> : <Exception403 />}
      </Layout>
    );
  }
} */

const mapContextToProps = ({ user, loadTokenUser, addError }) => ({
  user,
  loadTokenUser,
  addError,
});

export default withContext(mapContextToProps)(DatasetCreate);
