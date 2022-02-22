import React from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import { Button, Modal, Row, Col, notification } from "antd";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import Helmet from "react-helmet";
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

class Reference extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ref: null,
      error: null,
      showAddNewModal: false,
      submissionError: null,
    };
  }

  submitData = async (values) => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    const id = _.get(values, "id");
    const conf = {
      headers: {
        "Content-Type": "application/vnd.citationstyles.csl+json",
      },
    };
    const task = id
      ? axios.put(
          `${config.dataApi}dataset/${catalogueKey}/reference/${id}`,
          values,
          conf
        )
      : axios.post(
          `${config.dataApi}dataset/${catalogueKey}/reference`,
          values,
          conf
        );

    return task
      .then((res) => {
        let title = id ? "Reference updated" : "Reference saved";
        let msg = id
          ? `Data successfully updated for ${values.title}`
          : `${values.title} saved with id ${res.id}`;
        this.setState({ submissionError: null });
        /*         if (onSaveSuccess && typeof onSaveSuccess === "function") {
          onSaveSuccess(res);
        } */
        openNotification(title, msg);
      })
      .catch((err) => {
        this.setState({ submissionError: err });
      });
  };

  render() {
    const { showAddNewModal, submissionError } = this.state;
    const {
      catalogue,
      match: {
        params: { catalogueKey },
      },
      user
    } = this.props;

    return (
      <Layout
        title={catalogue ? catalogue.title : ""}
        selectedKeys={["assemblyReferences"]}
        openKeys={["assembly", "projectDetails"]}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>
            {catalogue ? `References - ${catalogue.title}` : "COL references"}
          </title>
          <link rel="canonical" href="https://www.checklistbank.org" />
        </Helmet>
        <PageContent>
          {showAddNewModal && (
            <Modal
              width={1000}
              title="New reference"
              visible={showAddNewModal}
              onOk={() => {
                this.setState({
                  showAddNewModal: false,
                  submissionError: null,
                });
              }}
              onCancel={() => {
                this.setState({
                  showAddNewModal: false,
                  submissionError: null,
                });
              }}
              destroyOnClose={true}
            >
              <RefForm
                submissionError={submissionError}
                onSubmit={this.submitData}
              />
            </Modal>
          )}
         {Auth.canEditDataset({key: catalogueKey}, user) && <Row>
            <Col style={{ textAlign: "right", marginBottom: "10px" }}>
              <Button onClick={() => this.setState({ showAddNewModal: true })}>
                Add new
              </Button>
            </Col>
          </Row>}

          <RefTable datasetKey={catalogueKey}></RefTable>
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue, user }) => ({
  catalogue,
  user
});
export default withContext(mapContextToProps)(withRouter(Reference));
