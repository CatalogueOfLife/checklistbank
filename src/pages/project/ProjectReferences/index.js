import { useState } from "react";
import withRouter from "../../../withRouter";
import axios from "axios";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import { Button, Modal, Row, Col, notification } from "antd";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import { Helmet } from "react-helmet-async";
import RefTable from "./RefTable";
import RefForm from "../../../components/MetaData/CslForm";
import _ from "lodash";
import Auth from "../../../components/Auth";

const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description,
  });
};

const Reference = ({ catalogue, match, user }) => {
  const { params: { projectKey } } = match;
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const submitData = async (values) => {
    const id = _.get(values, "id");
    const conf = {
      headers: {
        "Content-Type": "application/vnd.citationstyles.csl+json",
      },
    };
    const task = id
      ? axios.put(
        `${config.dataApi}dataset/${projectKey}/reference/${id}`,
        values,
        conf
      )
      : axios.post(
        `${config.dataApi}dataset/${projectKey}/reference`,
        values,
        conf
      );

    return task
      .then((res) => {
        let title = id ? "Reference updated" : "Reference saved";
        let msg = id
          ? `Data successfully updated for ${values.title}`
          : `${values.title} saved with id ${res.id}`;
        setSubmissionError(null);
        openNotification(title, msg);
      })
      .catch((err) => {
        setSubmissionError(err);
      });
  };

  return (
    <Layout
      title={catalogue ? catalogue.title : ""}
      selectedKeys={["assemblyReferences"]}
      openKeys={["assembly"]}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>
          {catalogue ? `References - ${catalogue.title}` : ""}
        </title>
      </Helmet>
      <PageContent>
        {showAddNewModal && (
          <Modal
            width={1000}
            title="New reference"
            open={showAddNewModal}
            onOk={() => {
              setShowAddNewModal(false);
              setSubmissionError(null);
            }}
            onCancel={() => {
              setShowAddNewModal(false);
              setSubmissionError(null);
            }}
            destroyOnHidden={true}
          >
            <RefForm
              submissionError={submissionError}
              onSubmit={submitData}
            />
          </Modal>
        )}
        {Auth.canEditDataset({ key: projectKey }, user) && <Row>
          <Col style={{ textAlign: "right", marginBottom: "10px" }}>
            <Button onClick={() => setShowAddNewModal(true)}>
              Add new
            </Button>
          </Col>
        </Row>}

        <RefTable datasetKey={projectKey}></RefTable>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogue, user }) => ({
  catalogue,
  user
});
export default withContext(mapContextToProps)(withRouter(Reference));
