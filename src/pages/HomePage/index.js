import React from "react";

import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import config from "../../config";
import _ from "lodash";
import moment from "moment"
import Helmet from "react-helmet";
import {
  Row,
  Col,
  Statistic,
  Card,
 
} from "antd";
import withContext from "../../components/hoc/withContext";

import axios from "axios";
const { MANAGEMENT_CLASSIFICATION } = config;
const { NAME_INDEX } = config;

const { Meta } = Card;

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      nameIndexData: null,
      nameIndexLoading: false,
      colDraftData: null,
      colDataLoading: false,
      datasets: null,
      datasetsLoading: false
    };
  }
  componentDidMount = () => {
    this.getNameIndexData();
    this.getCoLDraftData();
    this.getDatasets();
  };
  getNameIndexData = () => {
    this.setState({ nameIndexLoading: true });
    axios(
      `${
        config.dataApi
      }/dataset/${NAME_INDEX.key}/nameusage/search?facet=rank&facet=issue&facet=status&facet=nomstatus&facet=type&facet=field&limit=0`
    )
      .then(res => {
        this.setState({
          error: null,
          nameIndexLoading: false,
          nameIndexData: res.data
        });
      })
      .catch(err => this.setState({ error: err, nameIndexLoading: false }));
  };

  getCoLDraftData = () => {
    this.setState({ colDataLoading: true });
    axios(
      `${config.dataApi}dataset/${
        MANAGEMENT_CLASSIFICATION.key
      }/nameusage/search?facet=rank&facet=issue&facet=status&facet=nomstatus&facet=type&facet=field&limit=0`
    )
      .then(res => {
        this.setState({
          error: null,
          colDataLoading: false,
          colDraftData: res.data
        });
      })
      .catch(err => this.setState({ error: err, colDataLoading: false }));
  };

  getDatasets = () => {
    this.setState({ datasetsLoading: true });
    axios(`${config.dataApi}dataset?limit=3&sortBy=created`)
      .then(res => {
        this.setState({
          datasetsLoading: false,
          datasets: res.data,
          err: null
        });
      })

      .catch(err => {
        this.setState({ datasetsLoading: false, error: err, datasets: null });
      });
  };

  render() {
    const {
      nameIndexData,
      nameIndexLoading,
      colDraftData,
      colDataLoading,
      datasets
    } = this.state;
    const {catalogueKey} = this.props;
    return (
      <Layout openKeys={[]} selectedKeys={[]} title="">
{/*         <Helmet>
          <meta charSet="utf-8" />
          <title>Catalogue of Life +</title>
          <link rel="canonical" href="http://data.catalogue.life" />
        </Helmet> */}
        <Card
          style={{ marginTop: 20 }}
          title="Catalogue of Life +"
          hoverable
          cover={
            <img
              alt="example"
              src="//api.gbif.org/v1/image/unsafe/1170x422/http%3A%2F%2Fmycoportal.org%2Fimglib%2Fmycology%2FTENN_TENN-F%2FTENN-F-074%2FCoccomyces_triangularis_1_1529521643_lg.jpg"
            />
          }
        >
          <Row>
            <Col span={8}>
              {nameIndexData && (
                  <NavLink
                  to={{
                    pathname: `/names`
                  }}
                  exact={true}
                >
                <Statistic title="Names indexed" value={nameIndexData.total} />
                </NavLink>
              )}
            </Col>
            <Col span={8}>
              {colDraftData && (
                <NavLink
                  to={{
                    pathname: `/catalogue/${catalogueKey}/dataset/${MANAGEMENT_CLASSIFICATION.key}/names`
                  }}
                  exact={true}
                >
                  <Statistic
                    title="Names in the CoL draft"
                    value={colDraftData.total}
                  />
                </NavLink>
              )}
            </Col>
            <Col span={8}>
              {datasets && (
                  <NavLink
                  to={{
                    pathname: `/catalogue/${catalogueKey}/dataset`
                  }}
                  exact={true}
                >
                <Statistic
                  title="Datasets in the clearinghouse"
                  value={datasets.total}
                />
                </NavLink>
              )}
            </Col>
          </Row>



          <Meta title="Welcome to the Catalogue of Life Clearinghouse" />


<Row style={{ marginTop: 20 }}>
    <Col style={{ paddingRight: "10px" }} span={16}>
          <h3>Welcome to the Catalogue of Life Clearinghouse</h3>
          <p>
          The <a href="http://www.catalogueoflife.org">Catalogue of Life</a> has the mission to catalogue all known species as an authoritative consensus taxonomy produced by the global taxonomic community. Up to now it has completed peer-reviewed inclusion of nearly all extant species.
          </p>
          <p>
          Many large institutional users (i.e. GBIF, EOL, ALA, Lifewatch) extend their copy of the catalogue with additional names and species to complete it to serve their own specific purpose. These disconnected efforts result in ‘taxonomic inconsistencies’ and cause confusion amongst users.
          </p>
          <p>
          The <a href="https://github.com/Sp2000/colplus/blob/master/docs/CoL+slide-doc.pdf" >CoL+ project</a> seeks to replace these efforts with a shared, extended catalogue and complete the reviewed name coverage without sacrificing quality. Creating an open, shared, and sustainable consensus taxonomy to serve the proper linking of data in the global biodiversity information initiatives is the ultimate goal the project contributes to.
          </p>
          <p>The goals for the <a href="https://github.com/Sp2000/colplus/blob/master/docs/CoL+slide-doc.pdf" >Catalogue of Life Plus (CoL+)</a> project are:

</p>
          <ol>
            <li>
            creating both an extended and a strictly scrutinized taxonomic catalogue to replace the current GBIF Backbone Taxonomy and Catalogue of Life
            </li>
            <li>
            separating nomenclature (facts) and taxonomy (opinion) with different identifiers and authorities for names and taxa for better reuse            </li>
            <li>
            providing (infrastructural) support to the completion and strengthening of taxonomic and nomenclature content authorities            </li>
            <li>
            ensuring a sustainable, robust, and more dynamic IT infrastructure for maintaining the Catalogue of Life.
            </li>
            
          </ol>
          
        </Col>
      {datasets &&  <Col span={8}>
        <h3>Latest datasets registered</h3>
                  <ul>
                      {datasets.result.map(d => <li key={d.key}>
                        <NavLink 
                  to={{
                    pathname: `/catalogue/${catalogueKey}/dataset/${d.key}`
                  }}
                  exact={true}
                >
                    {d.title} ({moment(d.created).format("MMM Do YYYY")})
                </NavLink>
                      </li>)}
                  </ul>
        </Col> }
        </Row>






        </Card>
      </Layout>
    );
  }
}


const mapContextToProps = ({ catalogueKey }) => ({catalogueKey});

export default withContext(mapContextToProps)(HomePage);
