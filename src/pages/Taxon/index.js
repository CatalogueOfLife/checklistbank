import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import { NavLink } from "react-router-dom";
import { Alert, Tag, Icon, Row, Col, Button, Rate } from "antd";
import SynonymTable from "./Synonyms";
import VernacularNames from "./VernacularNames";
import References from "./References";
import CslReferences from "./CslReferences";
import Distributions from "./Distributions";
import Classification from "./Classification";
import NameRelations from "./NameRelations";
import ErrorMsg from "../../components/ErrorMsg";
import Layout from "../../components/LayoutNew";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import moment from "moment";
import history from "../../history";
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover"


const { MANAGEMENT_CLASSIFCATION } = config;

const md = 5;

class TaxonPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      taxon: null,
      info: null,
      taxonLoading: true,
      datasetLoading: true,
      infoLoading: true,
      classificationLoading: true,
      infoError: null,
      taxonError: null,
      classificationError: null,
      verbatimLoading: true,
      verbatimError: null,
      verbatim: null,
      logoUrl: null,
      sourceDataset: null
    };
  }

  componentDidMount = () => {
    this.getTaxon();
    this.getInfo();
    this.getClassification();
  };

  componentDidUpdate = (prevProps) => {
    const {
      match: {
        params: { key, taxonOrNameKey }
      },
      datasetKey
    } = this.props;
    if(prevProps.datasetKey !== datasetKey || _.get(prevProps, 'match.params.taxonOrNameKey') !==  taxonOrNameKey) {
    this.getTaxon();
    this.getInfo();
    this.getClassification();
    }
  }

  getTaxon = () => {
    const {
      match: {
        params: { key, taxonOrNameKey: taxonKey }
      },
      datasetKey
    } = this.props;
    this.setState({ loading: true });
    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${taxonKey}`
    )
      .then(res => {
        let promises = [res];
        if (_.get(res, "data.name.publishedInId")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${datasetKey}/reference/${
                _.get(res, "data.name.publishedInId")
              }`
            ).then(publishedIn => {
              res.data.name.publishedIn = publishedIn.data;
              return res;
            })
          );
        }

        if (_.get(res, "data.name")) {
          promises.push(
            axios(
              `${config.dataApi}dataset/${datasetKey}/name/${
                _.get(res, "data.name.id")
              }/relations`
            ).then(relations => {
              res.data.name.relations = relations.data;
              return Promise.all(
                relations.data.map(r => {
                  return axios(
                    `${config.dataApi}dataset/${datasetKey}/name/${
                      r.relatedNameId
                    }`
                  ).then(n => {
                    r.relatedName = n.data;
                  });
                })
              );
            })
          );
        }
        // sector keys are only present if its a catalogue
        if (_.get(res, "data.sectorKey")) {
          axios(`${config.dataApi}dataset/${datasetKey}/sector/${_.get(res, "data.sectorKey")}`).then(
            sector => {
              axios(
                `${config.dataApi}dataset/${_.get(
                  sector,
                  "data.subjectDatasetKey"
                )}/logo`
              )
                .then(() => {
                  this.setState({
                    logoUrl: `${config.dataApi}dataset/${_.get(
                      sector,
                      "data.subjectDatasetKey"
                    )}/logo`
                  });
                })
                .catch(() => {
                  // ignore, there is no logo
                });

              axios(
                `${config.dataApi}dataset/${_.get(sector, "data.subjectDatasetKey")}`
              ).then(dataset => {
                this.setState({ sourceDataset: dataset.data });
              });
            }
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

  getInfo = () => {
    const {
      match: {
        params: { key, taxonOrNameKey: taxonKey }
      },
      datasetKey
    } = this.props;

    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${
        taxonKey
      }/info`
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
        params: { key, taxonOrNameKey: taxonKey }
      },
      datasetKey
    } = this.props;

    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${
        taxonKey
      }/classification`
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
      dataset,
      datasetKey,
      catalogueKey
    } = this.props;
    const {
      taxon,
   //   synonyms,
      info,
      classification,
      sourceDataset,
      taxonError,
      synonymsError,
      classificationError,
      infoError    
    } = this.state;

    const synonyms = info && info.synonyms && info.synonyms.length > 0 ? info.synonyms.filter(s => s.status !== 'misapplied') : [];
    const misapplied = info && info.synonyms && info.synonyms.length > 0 ? info.synonyms.filter(s => s.status === 'misapplied') : [];

    return (
    
        <React.Fragment>
          <div
            style={{
              background: "#fff",
              padding: 24,
              minHeight: 280,
              margin: "16px 0",
              fontSize: "12px"
            }}
          >
            {taxonError && (
              <Alert message={<ErrorMsg error={taxonError} />} type="error" />
            )}
            {taxon && (
              <Row>
                <Col span={this.state.logoUrl ? 18 : 21}>
                  <h1
                    style={{ fontSize: "30px", fontWeight: '400', paddingLeft: "10px" , display: 'inline-block'}}
                    dangerouslySetInnerHTML={{
                      __html: taxon.labelHtml
                    }}
                  />
                 {taxon.referenceIds && <div style={{display: 'inline-block', paddingLeft: "10px"}}><ReferencePopover datasetKey={datasetKey} referenceId={taxon.referenceIds} placement="bottom"/></div>}
                </Col>
                <Col span={3}>
                  {taxon.provisional && <Tag color="red">Provisional</Tag>}
                  <Button
                    onClick={() => {
                      history.push(
                        datasetKey === catalogueKey ? `/catalogue/${catalogueKey}/name/${taxon.name.id}` : `/dataset/${taxon.datasetKey}/name/${taxon.name.id}`
                      );
                    }}
                  >
                    Name details
                  </Button>
                </Col>
                {this.state.logoUrl && (
                  <Col span={3}>
                    <img src={this.state.logoUrl} />
                  </Col>
                )}
              </Row>
            )}
            {_.get(taxon, "name.publishedIn.citation") && (
              <PresentationItem md={md} label="Published in">
                {_.get(taxon, "name.publishedIn.citation")}
              </PresentationItem>
            )}
            <Row style={{borderBottom: '1px solid #eee'}}>
              <Col span={12}>
              {_.get(taxon, "name.rank") && (
              <PresentationItem md={md * 2} label="Rank">
                {_.get(taxon, "name.rank")}
              </PresentationItem>
            )}
              </Col>
              <Col span={12}>
              {_.get(taxon, "status") && (
              <PresentationItem md={md * 2} label="Status">
                {_.get(taxon, "status")}
              </PresentationItem>
            )}</Col>
            </Row>
            
            
            {_.get(taxon, "webpage") && (
              <PresentationItem md={md} label="External webpage">
                <a href={_.get(taxon, "webpage")}>
                  <Icon type="link" />
                </a>
              </PresentationItem>
            )}


            {_.get(taxon, "name.nomStatus") && (
              <PresentationItem md={md} label="Nomenclatural Status">
                {_.get(taxon, "name.nomStatus")}
              </PresentationItem>
            )}
            <PresentationItem md={md} label="Extinct">
              <BooleanValue value={_.get(taxon, "extinct")} />
            </PresentationItem>
{/* 
            <PresentationItem md={md} label="Fossil">
              <BooleanValue value={_.get(taxon, "fossil")} />
            </PresentationItem>
            <PresentationItem md={md} label="Recent">
              <BooleanValue value={_.get(taxon, "recent")} />
            </PresentationItem> */}

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
                <NameRelations
                  style={{ marginTop: "-3px" }}
                  data={taxon.name.relations}
                  catalogueKey={catalogueKey}
                  datasetKey={datasetKey}
                />
              </PresentationItem>
            )}
            {infoError && (
              <Alert message={<ErrorMsg error={infoError} />} type="error" />
            )}

            {synonyms && synonyms.length > 0 && (
              <PresentationItem md={md} label="Synonyms">
                <SynonymTable
                  data={synonyms}
                  style={{ marginTop: "-3px" }}
                  datasetKey={datasetKey}
                  catalogueKey={catalogueKey}
                />
              </PresentationItem>
            )}

            {misapplied && misapplied.length > 0 && (
              <PresentationItem md={md} label="Misapplied names">
                <SynonymTable
                  data={misapplied}
                  style={{ marginBottom: 16, marginTop: "-3px" }}
                  datasetKey={datasetKey}
                  catalogueKey={catalogueKey}
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

            {_.get(info, "vernacularNames") && taxon && (
              <PresentationItem md={md} label="Vernacular names">
                <VernacularNames
                  style={{ marginTop: "-3px", marginLeft: "-3px" }}
                  data={info.vernacularNames}
                  datasetKey={taxon.datasetKey}
                  catalogueKey={catalogueKey}
                />
              </PresentationItem>
            )}

            {/*_.get(info, "references") && (
              <PresentationItem md={md} label="References">
               <CslReferences references={info.references}></CslReferences>

              </PresentationItem>
            ) */}

            {_.get(info, "distributions") && (
              <PresentationItem md={md} label="Distributions">
                <Distributions
                  style={{ marginTop: "-3px" }}
                  data={info.distributions}
                  datasetKey={datasetKey}
                  catalogueKey={catalogueKey}
                />
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
                <Classification
                  style={{ marginTop: "-3px", marginLeft: "-3px" }}
                  data={classification}
                  taxon={taxon}
                  datasetKey={datasetKey}
                  catalogueKey={catalogueKey}
                />
              </PresentationItem>
            )}
            <Row>
            {_.get(taxon, "accordingTo") && (<Col span={12}>
            
              <PresentationItem md={md * 2} label="According to">
                {`${_.get(taxon, "accordingTo")}`}
                {_.get(
                  taxon,
                  "accordingToDate"
                ) &&
                  `, ${moment(_.get(taxon, "accordingToDate")).format("LL")}`}
              </PresentationItem>
            
            </Col>)}
            <Col span={12}>
            {_.get(taxon, "origin") && (
              <PresentationItem md={md * 2} label="Origin">
                {_.get(taxon, "origin")}
              </PresentationItem>
            )}
            </Col>  

            </Row>
            
            {_.get(sourceDataset, "title") && (
              <PresentationItem md={md} label="Source database">
                <div style={{ display: "inline-block" }}>
                  {" "}
                  <NavLink
                    to={{
                      pathname: `/dataset/${_.get(sourceDataset, "key")}/meta`
                    }}
                    exact={true}
                  >
                    {_.get(sourceDataset, "title")}
                  </NavLink>
                  <span style={{ marginLeft: "10px" }}>
                    {_.get(sourceDataset, "completeness") && (_.get(sourceDataset, "completeness") + "%")}
                  </span>
                  {_.get(sourceDataset, "confidence") && (
                    <Rate
                      style={{ marginLeft: "10px" }}
                      value={_.get(sourceDataset, "confidence")}
                      disabled
                    />
                  )}
                </div>
              </PresentationItem>
            )}

            {_.get(taxon, "verbatimKey") && (
              <VerbatimPresentation
                verbatimKey={taxon.verbatimKey}
                datasetKey={taxon.datasetKey}
                expanded={false}
              />
            )}
          </div>
        </React.Fragment>
    );
  }
}

const mapContextToProps = ({ issueMap, dataset, catalogueKey }) => ({ issueMap, dataset, catalogueKey });

export default withContext(mapContextToProps)(TaxonPage);
