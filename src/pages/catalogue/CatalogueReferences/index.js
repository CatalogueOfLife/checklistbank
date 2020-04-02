import React from "react";
import {withRouter} from "react-router-dom"
import Layout from "../../../components/LayoutNew";
import {Button, Modal, Row, Col} from "antd"
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import _ from "lodash";
import Helmet from "react-helmet";
import RefTable from "./RefTable";
import RefForm from "./RefForm"

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
    const {catalogue, match: {
      params: { catalogueKey }
    },} = this.props;
    
    return (
      <Layout 
      title={catalogue ? catalogue.title : ''}
      selectedKeys={["assemblyReferences"]}
      openKeys={["assembly", "projectDetails"]}
      >
        <Helmet>
          <meta charSet="utf-8" />
          <title>{catalogue ? `References - ${catalogue.title}` : 'CoL references'}</title>
          <link rel="canonical" href="http://data.catalogue.life" />
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
        <RefForm datasetKey={catalogueKey} />
        </Modal>
        )}
        <Row>
            <Col style={{textAlign: "right", marginBottom: "10px"}}>
            <Button onClick={() => this.setState({showAddNewModal: true})}>
                Add new
            </Button></Col>

        </Row>
            
           <RefTable datasetKey={catalogueKey}></RefTable> 
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogue }) => ({
  catalogue
});
export default withContext(mapContextToProps)(withRouter(Reference));

