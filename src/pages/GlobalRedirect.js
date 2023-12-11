import React, { useEffect, useState } from "react";
import Layout from "../components/LayoutNew";
import PageContent from "../components/PageContent";
import { withRouter, Redirect } from "react-router-dom";
import { Row, Col, Card } from "antd";
import axios from "axios";
import Exception404 from "../components/exception/404";
import withContext from "../components/hoc/withContext";
import config from "../config";

const GlobalRedirect = ({
  addError,
  match: {
    params: { id },
  },
}) => {
  const [redirectUrl, setRedirctUrl] = useState(null);
  const [requestFinished, setRequestFinished] = useState(false);
  useEffect(() => {
    if (id) {
      getUrl();
    }
  }, [id]);

  const getUrl = () => {
    axios(`${config.dataApi}nameusage?id=${id}`)
      .then((res) => {
        if (res.data.result && res.data.result.length == 1) {
          const dkey = res?.data?.result?.[0]?.datasetKey;
          setRedirctUrl(`/dataset/${dkey}/nameusage/${id}`);
        }
        setRequestFinished(true);
      })
      .catch((err) => {
        console.log("error in api", err);
        addError(err);
        setRequestFinished(true);
      });
  };

  return !requestFinished ? (
    <Layout title="Global Name Usage ID Resolution">
      <PageContent>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col span={12}>Redirecting to {id} ...</Col>
          <Col flex="auto"></Col>
        </Row>
      </PageContent>
    </Layout>
  ) : !!redirectUrl ? (
    <Redirect
      to={{
        pathname: redirectUrl,
      }}
    />
  ) : (
    <Exception404 />
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(GlobalRedirect));
