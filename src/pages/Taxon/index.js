import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import { NavLink } from "react-router-dom";
import { Alert, Tag, Breadcrumb, Row, Col, Button } from "antd";
import SynonymTable from "./Synonyms";
import VernacularNames from "./VernacularNames";
import References from "./References";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import VerbatimPresentation from "../../components/VerbatimPresentation"
import moment from "moment";
import history from "../../history";
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";

const md = 5;

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      taxon: null,
      synonyms: null,
      info: null,
      taxonLoading: true,
      datasetLoading: true,
      synonymsLoading: true,
      infoLoading: true,
      classificationLoading: true,
      infoError: null,
      taxonError: null,
      synonymsError: null,
      classificationError: null,
      verbatimLoading: true,
      verbatimError: null,
      verbatim: null
    };
  }

  componentWillMount = () => {
    this.getTaxon();
    this.getSynonyms();
    this.getInfo();
    this.getClassification();
  }


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
        if (_.get(res, "data.name.publishedInId")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${key}/reference/${encodeURIComponent(
                _.get(res, "data.name.publishedInId")
              )}`
            ).then(publishedIn => {
              res.data.name.publishedIn = publishedIn.data;
              return res;
            })
          );
        }

        if (_.get(res, "data.name")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
                _.get(res, "data.name.id")
              )}/relations`
            ).then(relations => {
              res.data.name.relations = relations.data;
              return Promise.all(
                relations.data.map(r => {
                  return axios(
                    `${config.dataApi}dataset/${key}/name/${encodeURIComponent(
                      r.relatedNameId
                    )}`
                  ).then(n => {
                    r.relatedName = n.data;
                  });
                })
              );
            })
          );
        }
        return Promise.all(promises);
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
        params: { key }
      },
      dataset
    } = this.props;
    const {
      taxon,
      synonyms,
      info,
      classification,
      taxonError,
      synonymsError,
      classificationError,
      infoError
    } = this.state;

    const homotypic = _.get(synonyms, 'homotypic') ? _.get(synonyms, 'homotypic')  : []
    const heterotypic = _.get(synonyms, 'heterotypic') ? _.get(synonyms, 'heterotypic')  : []

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
                  <Button
                    onClick={() => {
                      history.push(
                        `/dataset/${taxon.datasetKey}/name/${taxon.name.id}`
                      );
                    }}
                  >
                    Name details
                  </Button>
                </Col>
              </Row>
            )}
            {_.get(taxon, "accordingTo") && (
              <PresentationItem md={md} label="According to">
                {`${_.get(taxon, "accordingTo")}${_.get(
                  taxon,
                  "accordingToDate"
                ) &&
                  `, ${moment(_.get(taxon, "accordingToDate")).format("LL")}`}`}
              </PresentationItem>
            )}
            {_.get(taxon, "status") && (
              <PresentationItem md={md} label="Status">
                {_.get(taxon, "status")}
              </PresentationItem>
            )}
            {_.get(taxon, "origin") && (
              <PresentationItem  md={md} label="Origin">
                {_.get(taxon, "origin")}
              </PresentationItem>
            )}

            <PresentationItem md={md} label="Fossil">
              <BooleanValue value={_.get(taxon, "fossil")} />
            </PresentationItem>
            <PresentationItem md={md} label="Recent">
              <BooleanValue value={_.get(taxon, "recent")} />
            </PresentationItem>

            {_.get(taxon, "name.relations") && taxon.name.relations.length > 0 && (
              <PresentationItem
              md={md}
                label="Relations"
                helpText={
                  <a href="https://github.com/Sp2000/colplus/blob/master/docs/NAMES.md#name-relations">
                    Name relations are explained here
                  </a>
                }
              >
                <NameRelations style={{marginTop: '-10px'}} data={taxon.name.relations} />
              </PresentationItem>
            )}
            {_.get(taxon, "name.publishedIn.citation") && (
              <PresentationItem md={md} label="Published in">
                {_.get(taxon, "name.publishedIn.citation")}
              </PresentationItem>
            )}
            {infoError && (
              <Alert message={<ErrorMsg error={infoError} />} type="error" />
            )}

            {(heterotypic.length > 0 || homotypic.length) > 0 && (
              <PresentationItem md={md} label="Synonyms">
                <SynonymTable
                  data={[...homotypic.map(s => ({...s, homotypic: true})), ...heterotypic]}
                  style={{ marginBottom: 16, marginTop: '-10px' }}
                  datasetKey={key}
                />
              </PresentationItem>
            )}
            {_.get(synonyms, "misapplied") && (
              <PresentationItem md={md} label="Misapplied names">
                <SynonymTable
                  data={synonyms.misapplied.map(n => n.name)}
                  style={{ marginBottom: 16, marginTop: '-10px'  }}
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
              <PresentationItem md={md} label="Lifezones">
                {_.get(taxon, "lifezones").join(", ")}
              </PresentationItem>
            )}

            {_.get(info, "vernacularNames") && (
              <PresentationItem md={md} label="Vernacular names">
                <VernacularNames style={{ marginTop: '-10px',  marginLeft: '-10px'  }} data={info.vernacularNames} />
              </PresentationItem>
            )}

            {_.get(info, "references") && (
              <PresentationItem md={md} label="References">
                <References style={{marginTop: '-10px'}} data={info.references} />
              </PresentationItem>
            )}

            {_.get(info, "distributions") && (
              <PresentationItem md={md} label="Distributions">
                <Distributions style={{marginTop: '-10px'}} data={info.distributions} />
              </PresentationItem>
            )}
            {_.get(taxon, "remarks") && (
              <PresentationItem md={md} label="Remarks">
                {taxon.remarks}
              </PresentationItem>
            )}

            {classificationError && (
              <Alert
                message={<ErrorMsg error={classificationError} />}
                type="error"
              />
            )}
            {classification && (
              <PresentationItem md={md} label="Classification">
                <Classification style={{marginTop: '-10px', marginLeft: '-10px' }} data={classification} datasetKey={key} />
              </PresentationItem>
            )}
            {_.get(taxon, 'verbatimKey') && <VerbatimPresentation verbatimKey={taxon.verbatimKey} datasetKey={taxon.datasetKey}></VerbatimPresentation>}
          </div>
        </React.Fragment>
      </Layout>
    );
  }
}

const mapContextToProps = ({ issueMap, dataset }) => ({ issueMap, dataset });

export default withContext(mapContextToProps)(TaxonPage);
