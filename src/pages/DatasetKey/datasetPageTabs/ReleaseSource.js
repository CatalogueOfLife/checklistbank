import React from "react";
import config from "../../../config";
import axios from "axios";
import { Alert, Rate, Row, Col, Divider } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import Exception from "../../../components/exception/Exception";
import { Link } from "react-router-dom";
import Auth from "../../../components/Auth";
import Metrics from "../../../components/ReleaseSourceMetrics";
import _ from "lodash";
import PresentationItem from "../../../components/PresentationItem";
import AgentPresentation from "../../../components/MetaData/AgentPresentation";

import withContext from "../../../components/hoc/withContext";
import TaxonomicCoverage from "../../catalogue/CatalogueSourceMetrics/TaxonomicCoverage";
import { IDENTIFIER_TYPES } from "./DatasetMeta";

class ReleaseSource extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetLoading: true,
      data: null,
    };
  }

  componentDidMount = () => {
    this.getData();
  };

  getData = () => {
    const {
      match: {
        params: { taxonOrNameKey: sourceKey },
      },
      datasetKey,
    } = this.props;

    axios(`${config.dataApi}dataset/${datasetKey}/source/${sourceKey}`)
      .then((dataset) => {
        this.setState({ data: dataset.data, datasetError: null });
      })
      .catch((err) => this.setState({ datasetError: err, data: null }));
  };

  render() {
    const { pathToTree, datasetKey, dataset, user } = this.props;
    const { data, datasetError } = this.state;

    return (
      <React.Fragment>
        <div
          className="catalogue-of-life"
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0",
            fontSize: "12px",
          }}
        >
          {datasetError &&
            _.get(datasetError, "response.data.code") !== 404 && (
              <Alert message={<ErrorMsg error={datasetError} />} type="error" />
            )}
          {datasetError &&
            _.get(datasetError, "response.data.code") === 404 && (
              <Exception
                type="404"
                desc="Sorry, the page you visited does not exist"
                linkElement={Link}
                backText="Back to dashboard"
              />
            )}
          {data && (
            <Row>
              <Col flex="auto">
                {/*                 <h1
                  style={{ fontSize: "30px", fontWeight: '400', paddingLeft: "10px" , display: 'inline-block', textTransform: 'none'}}
                  
                    >Database details</h1> */}
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: "400",
                    paddingLeft: "10px",
                    display: "inline-block",
                    textTransform: "none",
                  }}
                >
                  {data.title}
                </h1>
                <h4
                  style={{
                    paddingLeft: "14px",
                    marginTop: "-20px",
                  }}
                >
                  in {dataset.title}
                </h4>
              </Col>

              <Col>
                <img
                  src={`${config.dataApi}image/${datasetKey}/source/${data.key}/logo?size=MEDIUM`}
                  alt={_.get(data, "title")}
                />
              </Col>
            </Row>
          )}

          {data && (
            <React.Fragment>
              <div>
                <PresentationItem label="Alias">{data.alias}</PresentationItem>
                {/*               <PresentationItem label="Full name">
                {data.title}
              </PresentationItem> */}
                <PresentationItem
                  label={
                    data.version || data.issued
                      ? `${data.version ? "Version" : ""}${
                          data.version && data.issued ? " / " : ""
                        }${data.issued ? "Issued" : ""}`
                      : "Version"
                  }
                >
                  {(data.version || data.issued) &&
                    `${data.version ? data.version : ""}${
                      data.issued ? " / " + data.issued : ""
                    }`}
                </PresentationItem>
                <PresentationItem label="DOI">
                  {data.doi ? (
                    <a href={`https://doi.org/${data.doi}`}>{data.doi}</a>
                  ) : (
                    "-"
                  )}
                </PresentationItem>
                {data.contact && !_.isEmpty(data.contact) && (
                  <PresentationItem label="Contact">
                    <AgentPresentation
                      hideEmail={!Auth.canEditDataset(data, user)}
                      agent={data.contact}
                    />
                  </PresentationItem>
                )}
                {data.publisher && !_.isEmpty(data.publisher) && (
                  <PresentationItem label="Publisher">
                    <AgentPresentation
                      hideEmail={!Auth.canEditDataset(data, user)}
                      agent={data.publisher}
                    />
                  </PresentationItem>
                )}
                {data.creator && (
                  <PresentationItem label="Creator">
                    <Row gutter={[8, 8]}>
                      {data.creator.map((a) => (
                        <Col>
                          <AgentPresentation
                            hideEmail={!Auth.canEditDataset(data, user)}
                            agent={a}
                          />
                        </Col>
                      ))}
                    </Row>
                  </PresentationItem>
                )}
                {data.editor && (
                  <PresentationItem label="Editor">
                    <Row gutter={[8, 8]}>
                      {data.editor.map((a) => (
                        <Col>
                          <AgentPresentation
                            hideEmail={!Auth.canEditDataset(data, user)}
                            agent={a}
                          />
                        </Col>
                      ))}
                    </Row>
                  </PresentationItem>
                )}
                {data.contributor && (
                  <PresentationItem label="Contributor">
                    <Row gutter={[8, 8]}>
                      {data.contributor.map((a) => (
                        <Col>
                          <AgentPresentation
                            hideEmail={!Auth.canEditDataset(data, user)}
                            agent={a}
                          />
                        </Col>
                      ))}
                    </Row>
                  </PresentationItem>
                )}
                <PresentationItem label="Abstract">
                  {data.description}
                </PresentationItem>
                <PresentationItem label="Taxonomic scope">
                  {data.taxonomicScope || "-"}
                </PresentationItem>
                <PresentationItem label="Geographic scope">
                  {data.geographicScope || "-"}
                </PresentationItem>
                <PresentationItem label="Temporal scope">
                  {data.temporalScope || "-"}
                </PresentationItem>
                {/*             <PresentationItem label="Origin">
              {data.origin}
            </PresentationItem> */}
                {/*             <PresentationItem label="Type">{data.type}</PresentationItem>
                 */}{" "}
                <PresentationItem label="License">
                  {data.license || "-"}
                </PresentationItem>
                <PresentationItem label="Checklist Confidence">
                  {<Rate value={data.confidence} disabled></Rate>}
                </PresentationItem>
                <PresentationItem label="Completeness">
                  {data.completeness}
                </PresentationItem>
                <PresentationItem label="Url (website)">
                  {data.url ? (
                    <a href={data.url} target="_blank">
                      {data.url}
                    </a>
                  ) : (
                    "-"
                  )}
                </PresentationItem>
                {/* <PresentationItem label="Logo Url">
              {data.url && (
                <a href={data.logoUrl} target="_blank">
                  {data.logoUrl}
                </a>
              )}
            </PresentationItem> */}
                <PresentationItem label="ISSN">
                  {data.issn ? (
                    <a
                      href={`https://portal.issn.org/resource/ISSN/${data.issn}`}
                    >
                      {data.issn}
                    </a>
                  ) : (
                    "-"
                  )}
                </PresentationItem>
                <PresentationItem label="GBIF key">
                  {data.gbifKey ? (
                    <a href={`https://www.gbif.org/dataset/${data.gbifKey}`}>
                      {data.gbifKey}
                    </a>
                  ) : (
                    "-"
                  )}
                </PresentationItem>
                {/*             <PresentationItem label="GBIF publisher key">
              {data.gbifPublisherKey && (
                <a
                  href={`https://www.gbif.org/publisher/${data.gbifPublisherKey}`}
                >
                  {data.gbifPublisherKey}
                </a>
              )}
            </PresentationItem> */}
                <PresentationItem label="Identifiers">
                  {data.identifier ? (
                    <ol
                      style={{
                        listStyle: "none",
                        paddingInlineStart: "0px",
                      }}
                    >
                      {Object.keys(data.identifier).map((i) => (
                        <li
                          style={{
                            float: "left",
                            marginRight: "8px",
                          }}
                        >
                          {`${i.toUpperCase()}: `}
                          {IDENTIFIER_TYPES[i] ? (
                            <a
                              href={`${IDENTIFIER_TYPES[i]}${data.identifier[i]}`}
                              target="_blank"
                            >
                              {data.identifier[i]}
                            </a>
                          ) : (
                            data.identifier[i]
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    "-"
                  )}
                </PresentationItem>
                <PresentationItem label="Citation">
                  {data.citation && (
                    <span
                      dangerouslySetInnerHTML={{ __html: data.citation }}
                    ></span>
                  )}
                </PresentationItem>
                {/*             <PresentationItem label="Derived from (sourceKey)">
              {data.sourceKey}
            </PresentationItem> */}
                <PresentationItem label="Source">
                  {data.source && _.isArray(data.source)
                    ? data.source.map(
                        (s) =>
                          !!s &&
                          (s.citation ? (
                            <div
                              style={{ display: "inline-block" }}
                              dangerouslySetInnerHTML={{ __html: s.citation }}
                            ></div>
                          ) : (
                            s.title
                          ))
                      )
                    : "-"}
                </PresentationItem>
              </div>
              <Divider orientation="left">Contributions</Divider>
              <PresentationItem label="Taxonomic coverage">
                <TaxonomicCoverage
                  isProject={false}
                  dataset={data}
                  catalogueKey={datasetKey}
                  pathToTree={pathToTree}
                />
              </PresentationItem>
              <Metrics
                catalogueKey={datasetKey}
                dataset={data}
                pathToSearch={`/dataset/${datasetKey}/names`}
              />

              {/*           <PresentationItem label="Created">
          {`${data.created} by ${data.createdByUser}`}
          </PresentationItem>
          <PresentationItem label="Modified">
          {`${data.modified} by ${data.modifiedByUser}`}
          </PresentationItem> */}
              {/*           <section className="code-box" style={{marginTop: '32px'}}>
          <div className="code-box-title">Settings</div>
        </section> */}
            </React.Fragment>
          )}
        </div>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ dataset, user }) => ({
  dataset,
  user,
});
export default withContext(mapContextToProps)(ReleaseSource);
