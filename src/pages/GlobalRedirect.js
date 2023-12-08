import React, { useEffect, useState } from "react";
import Layout from "../components/LayoutNew";
import PageContent from "../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Card } from "antd";
import axios from "axios";

import withContext from "../components/hoc/withContext";
import config from "../config";

const GlobalRedirect = ({ addError,
    match: {
        params: { id },
    },
}) => {

    axios(`${config.dataApi}nameusage?id=${id}`)
        .then(res => {
            if (res.data.result && res.data.result.length == 1) {
                const dkey = res.data.result[0].datasetKey;
                const url = `${config.url}dataset/${dkey}/nameusage/${id}`;
                window.location.assign(url);
            } else {
                console.log(`ID not existing or globally unique: ${id}`)
                window.location.assign(`${config.url}404/${id}`);
            }
        })
        .catch((err) => {
            console.log("error in api", err)
            addError(err);
        });
    return (
        <Layout
            title="Global Name Usage ID Resolution"
        >
            <PageContent>
                <Row style={{ marginTop: "10px" }}>
                    <Col flex="auto"></Col>
                    <Col span={12}>
                        Redirecting to {id} ...
                    </Col>
                    <Col flex="auto"></Col>
                </Row>
            </PageContent>
        </Layout>
    );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(GlobalRedirect));
