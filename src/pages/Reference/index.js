import React from "react";

import Layout from "../../components/LayoutNew";
import {Button, Modal, Row, Col} from "antd"
import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";
import RefTable from "./RefTable";
import RefForm from "./RefForm"
const { MANAGEMENT_CLASSIFICATION } = config;

class Reference extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ref: null,
      error: null,
      showAddNewModal: false
    };
  }



  render() {
    const {
      ref,
      error,
      showAddNewModal
    } = this.state;

    return (
      <Layout 
      title="CoL references"
      selectedKeys={["assemblyReferences"]}
        openKeys={["assembly"]}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL References</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
        {showAddNewModal && (
          <Modal
          width={1000}
          title="New reference"
          visible={showAddNewModal}
          onOk={() => {
            this.setState({ showAddNewModal: false });
          }}
          onCancel={() => {
            this.setState({ showAddNewModal: false });
          }}
          destroyOnClose={true}
        > 
        <RefForm datasetKey={MANAGEMENT_CLASSIFICATION.key} />
        </Modal>
        )}
        <Row>
            <Col style={{textAlign: "right", marginBottom: "10px"}}>
            <Button onClick={() => this.setState({showAddNewModal: true})}>
                Add new
            </Button></Col>

        </Row>
            
           <RefTable datasetKey={MANAGEMENT_CLASSIFICATION.key}></RefTable> 
        { /* <RefForm datasetKey={MANAGEMENT_CLASSIFICATION.key}/> */}
        </PageContent>
      </Layout>
    );
  }
}

export default Reference;
