import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import queryString from "query-string";
import { NavLink } from "react-router-dom";
import { Collapse, Alert, Tag, Breadcrumb, Row, Col } from "antd";
import SynonymTable from "./Synonyms";
import VernacularNames from "./VernacularNames";
import References from "./References";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations"
import ErrorMsg from "../../components/ErrorMsg";
import KeyValueList from "./KeyValueList";
import Layout from "../../components/LayoutNew";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import moment from 'moment'
const { Panel } = Collapse;

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataset: null,
      taxon: null,
      synonyms: null,
      info: null,
      taxonLoading: true,
      datasetLoading: true,
      synonymsLoading: true,
      infoLoading: true,
      classificationLoading: true,
      infoError: null,
      datasetError: null,
      taxonError: null,
      synonymsError: null,
      classificationError: null
    };
  }

  componentWillMount() {
    this.getDataset();
    this.getTaxon();
    this.getSynonyms();
    this.getInfo();
    this.getClassification();
  }

  getDataset = () => {
    const {
      match: {
        params: { key }
      }
    } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then(res => {
        this.setState({
          datasetLoading: false,
          dataset: res.data,
          datasetError: null
        });
      })
      .catch(err => {
        this.setState({
          datasetLoading: false,
          datasetError: err,
          dataset: null
        });
      });
  };
  getTaxon = () => {
    const {
      match: {
        params: { key, taxonKey }
      }
    } = this.props;
    this.setState({ loading: true });
    axios(
      `${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(taxonKey)}`
    )
      .then(res => {

        let promises = [res];
        if(_.get(res, "data.name.publishedInId")){
            promises.push(axios(
                `${config.dataApi}dataset/${key}/reference/${encodeURIComponent(
                  _.get(res, "data.name.publishedInId")
                )}`
              ).then(publishedIn => {
                res.data.name.publishedIn = publishedIn.data;
                return res;
              }))
        }

        if(_.get(res, "data.name")){
            promises.push(
                axios(
                    `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
                        _.get(res, "data.name.id")
                    )}/relations`
                  )
                  .then(relations => {
                    res.data.name.relations = relations.data;
                    return Promise.all(relations.data.map((r)=> {
                       return axios(
                        `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
                            r.relatedNameId
                        )}`
                      ).then(
                          (n)=> {r.relatedName = n.data}
                          )
                        
                        }
                  ))
                
                })
            )}

        return Promise.all(promises)
      })
      .then(res => {
        this.setState({
          taxonLoading: false,
          taxon: res[0].data,
          taxonError: null
        });
      })
      .catch(err => {
        this.setState({ taxonLoading: false, taxonError: err, taxon: null });
      });
  };

  getSynonyms = () => {
    const {
      match: {
        params: { key, taxonKey }
      }
    } = this.props;

    axios(
      `${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(
        taxonKey
      )}/synonyms`
    )
      .then(res => {
        this.setState({
          synonymsLoading: false,
          synonyms: res.data,
          synonymsError: null
        });
      })
      .catch(err => {
        this.setState({
          synonymsLoading: false,
          synonymsError: err,
          synonyms: null
        });
      });
  };

  getInfo = () => {
    const {
      match: {
        params: { key, taxonKey }
      }
    } = this.props;

    axios(
      `${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(
        taxonKey
      )}/info`
    )
      .then(res => {
        this.setState({ infoLoading: false, info: res.data, infoError: null });
      })
      .catch(err => {
        this.setState({ infoLoading: false, infoError: err, info: null });
      });
  };

  getClassification = () => {
    const {
      match: {
        params: { key, taxonKey }
      }
    } = this.props;

    axios(
      `${config.dataApi}dataset/${key}/taxon/${encodeURIComponent(
        taxonKey
      )}/classification`
    )
      .then(res => {
        this.setState({
          classificationLoading: false,
          classification: res.data,
          classificationError: null
        });
      })
      .catch(err => {
        this.setState({
          classificationLoading: false,
          classificationError: err,
          classification: null
        });
      });
  };

  render() {
    const {
      match: {
        params: { key, taxonKey }
      }
    } = this.props;
    const {
      datasetLoading,
      taxonLoading,
      classificationLoading,
      synonymsLoading,
      infoLoading,
      dataset,
      taxon,
      synonyms,
      info,
      classification,
      datasetError,
      taxonError,
      synonymsError,
      classificationError,
      infoError
    } = this.state;

    return (
      <Layout
        selectedDataset={dataset}
        selectedTaxon={taxon}
        openKeys={["dataset", "datasetKey"]}
        selectedKeys={["taxon"]}
      >
        <React.Fragment>
          {dataset && taxon && (
            <Breadcrumb style={{ marginTop: "10px" }}>
              <Breadcrumb.Item>
                <NavLink to={{ pathname: `/dataset` }}>Dataset</NavLink>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <NavLink to={{ pathname: `/dataset/${dataset.key}/metrics` }}>
                  {dataset.title}
                </NavLink>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <NavLink
                  to={{ pathname: `/dataset/${dataset.key}/classification` }}
                >
                  Classification
                </NavLink>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span
                  dangerouslySetInnerHTML={{ __html: taxon.name.formattedName }}
                />
              </Breadcrumb.Item>
            </Breadcrumb>
          )}

          <div
            style={{
              background: "#fff",
              padding: 24,
              minHeight: 280,
              margin: "16px 0"
            }}
          >
           {taxonError && (
              <Alert message={<ErrorMsg error={taxonError} />} type="error" />
            )}
            {taxon && (
              <Row>
                <Col span={20}>
                  <h1
                    dangerouslySetInnerHTML={{
                      __html: taxon.name.formattedName
                    }}
                  />{" "}
                </Col>
                <Col span={4}>
                  {taxon.provisional && <Tag color="red">Provisional</Tag>}
                </Col>
              </Row>
            )}
            {_.get(taxon, "accordingTo") && (
              <PresentationItem label="According to">
                {_.get(taxon, "accordingTo")}
              </PresentationItem>
            )}
            {_.get(taxon, "accordingToDate") && (
              <PresentationItem label="According to date">
                {moment(_.get(taxon, "accordingToDate")).format("LL")}
              </PresentationItem>
            )}
            {_.get(taxon, "status") && (
              <PresentationItem label="Status">
                {_.get(taxon, "status")}
              </PresentationItem>
            )}
            {_.get(taxon, "name.relations") && taxon.name.relations.length > 0 && 
                <PresentationItem label="Relations">
                    <NameRelations data={taxon.name.relations}></NameRelations>
                </PresentationItem>
                
            }
            {_.get(taxon, "name.publishedIn.citation") && (
              <PresentationItem label="Published in">
                {_.get(taxon, "name.publishedIn.citation")}
              </PresentationItem>
            )}
            {infoError && (
              <Alert message={<ErrorMsg error={infoError} />} type="error" />
            )}

            {_.get(synonyms, "homotypic") && (
              <PresentationItem label="Homotypic synonyms">
                <SynonymTable
                  data={synonyms.homotypic}
                  style={{ marginBottom: 16 }}
                  datasetKey={key}
                />
              </PresentationItem>
            )}
            {_.get(synonyms, "heterotypic") && (
              <PresentationItem label="Heterotypic synonyms">
                <SynonymTable
                  data={synonyms.heterotypic}
                  style={{ marginBottom: 16 }}
                  datasetKey={key}
                />
              </PresentationItem>
            )}
            {_.get(synonyms, "misapplied") && (
              <PresentationItem label="Misapplied names">
                <SynonymTable
                  data={synonyms.misapplied}
                  style={{ marginBottom: 16 }}
                  datasetKey={key}
                />
              </PresentationItem>
            )}
            {synonymsError && (
              <Alert
                message={<ErrorMsg error={synonymsError} />}
                type="error"
              />
            )}
            {_.get(taxon, "lifezones") && (
              <PresentationItem label="Lifezones">
                {_.get(taxon, "lifezones").join(', ')}
              </PresentationItem>
            )}
            
            {_.get(info, "vernacularNames") && (
              <PresentationItem label="Vernacular names">
                <VernacularNames data={info.vernacularNames} />
              </PresentationItem>
            )}

            {_.get(info, "references") && (
              <PresentationItem label="References">
                <References data={info.references} />
              </PresentationItem>
            )}

            {_.get(info, "distributions") && (
              <PresentationItem label="Distributions">
                <Distributions data={info.distributions} />
              </PresentationItem>
            )}
            {_.get(taxon, "remarks") && (
              <PresentationItem label="Remarks">
                <Distributions data={taxon.remarks} />
              </PresentationItem>
            )}
            
            {classificationError && (
              <Alert
                message={<ErrorMsg error={classificationError} />}
                type="error"
              />
            )}
            {classification && (
              <PresentationItem label="Classification">
                <Classification data={classification} datasetKey={key} />
              </PresentationItem>
            )}
          </div>
        </React.Fragment>
      </Layout>
    );
  }
}

export default TaxonPage;
