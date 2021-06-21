import React from "react";
import config from "../../../config";
import axios from "axios";
import { Rate, Divider, Row, Col } from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import PresentationItem from "../../../components/PresentationItem";
import PageContent from "../../../components/PageContent";
import marked from "marked";
import DOMPurify from "dompurify";
import withContext from "../../../components/hoc/withContext";

const IDENTIFIER_TYPES = {
  col: "https://data.catalogueoflife.org/dataset/",
  gbif: "https://www.gbif.org/dataset/",
  plazi: "http://publication.plazi.org/id/",
  doi: "https://doi.org/",
};

class DatasetAbout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetLoading: true,
      data: null,
    };
  }

  componentDidMount = () => {
    this.getContributions();
  };

  componentDidUpdate = (prevProps) => {
    if (_.get(this.props, "datasetKey") !== _.get(prevProps, "datasetKey")) {
      this.getContributions();
    }
  };

  getContributions = () => {
    const { datasetKey } = this.props;

    axios(
      `${config.dataApi}dataset?limit=1000&hasSourceDataset=${datasetKey}&origin=managed`
    )
      .then((res) => {
        this.setState({
          contributesTo: res.data.result || null,
        });
      })
      .catch((err) => {
        this.setState({ error: err, contributesTo: null });
      });
  };

  render() {
    const { dataset } = this.props;
    const { contributesTo } = this.state;
    return (
      <PageContent>
        {dataset && (
          <React.Fragment>
            <div>
              <PresentationItem label="Alias">{dataset.alias}</PresentationItem>
              {/*               <PresentationItem label="Full name">
                {dataset.title}
              </PresentationItem> */}
              <PresentationItem
                label={`${dataset.version ? "Version" : ""}${
                  dataset.version && dataset.issued ? " / " : ""
                }${dataset.issued ? "Issued" : ""}`}
              >
                {(dataset.version || dataset.issued) &&
                  `${dataset.version ? dataset.version : ""}${
                    dataset.issued ? " / " + dataset.issued : ""
                  }`}
              </PresentationItem>
              {dataset.creator && _.isArray(dataset.creator) && (
                <PresentationItem label="Creators">
                  {dataset.creator
                    .filter((a) => !!a.name)
                    .map((a) => a.name)
                    .join(", ")}
                </PresentationItem>
              )}
              {dataset.contributor && _.isArray(dataset.contributor) && (
                <PresentationItem label="Contributors">
                  {dataset.contributor
                    .filter((a) => !!a.name)
                    .map((a) => a.name)
                    .join(", ")}
                </PresentationItem>
              )}
              {dataset.editor && _.isArray(dataset.editor) && (
                <PresentationItem label="Editors">
                  {dataset.editor
                    .filter((a) => !!a.name)
                    .map((a) => a.name)
                    .join(", ")}
                </PresentationItem>
              )}
              {/*   <PresentationItem label="Taxonomic coverage">
                              
                  <TaxonomicCoverage
                    isProject={false}
                    catalogueKey={datasetKey}
                    pathToTree={pathToTree}
                  /> 
              </PresentationItem>*/}
              <PresentationItem label="Taxonomic scope">
                {dataset.taxonomicScope}
              </PresentationItem>
              {/*               <Metrics
                catalogueKey={datasetKey}
                dataset={data}
                pathToSearch={`/dataset/${datasetKey}/names`}
              />  */}
              <PresentationItem label="Description">
                {dataset.description ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked(dataset.description)),
                    }}
                  ></span>
                ) : (
                  dataset.description
                )}
              </PresentationItem>

              <PresentationItem label="Publisher">
                {_.get(dataset, "publisher.name")}
              </PresentationItem>
              <PresentationItem label="Url (website)">
                {dataset.url && (
                  <a href={dataset.url} target="_blank">
                    {dataset.url}
                  </a>
                )}
              </PresentationItem>
              {/*  
          <PresentationItem label="Contact">
            {dataset.contact}
          </PresentationItem>


           <PresentationItem label="Type">
            {dataset.type}
          </PresentationItem> */}

              <PresentationItem label="Geographic scope">
                {dataset.geographicScope}
              </PresentationItem>
              <PresentationItem label="Temporal scope">
                {dataset.temporalScope}
              </PresentationItem>
              <PresentationItem label="Completeness">
                {dataset.completeness}
              </PresentationItem>
              <PresentationItem label="Checklist Confidence">
                {<Rate defaultValue={dataset.confidence} disabled></Rate>}
              </PresentationItem>
              <PresentationItem label={"DOI"}>{dataset.doi}</PresentationItem>
              <PresentationItem label="Source">
                {dataset.source &&
                  _.isArray(dataset.source) &&
                  dataset.source.map(
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
                  )}
              </PresentationItem>

              <PresentationItem label="License">
                {dataset.license}
              </PresentationItem>
              {dataset.identifier && (
                <PresentationItem label="Identifiers">
                  <ol
                    style={{
                      listStyle: "none",
                      paddingInlineStart: "0px",
                    }}
                  >
                    {Object.keys(dataset.identifier).map((i) => (
                      <li
                        style={{
                          float: "left",
                          marginRight: "8px",
                        }}
                      >
                        {`${i.toUpperCase()}: `}
                        <a
                          href={`${IDENTIFIER_TYPES[i]}${dataset.identifier[i]}`}
                          target="_blank"
                        >
                          {dataset.identifier[i]}
                        </a>
                      </li>
                    ))}
                  </ol>
                </PresentationItem>
              )}
            </div>
            {contributesTo && (
              <React.Fragment>
                <Divider orientation="left">Contributes</Divider>
                {contributesTo
                  .map((c) => (
                    <NavLink
                      to={{
                        pathname: `/dataset/${c.key}/source/${dataset.key}`,
                      }}
                      exact={true}
                    >
                      {c.title}
                    </NavLink>
                  ))
                  .reduce((prev, curr) => [prev, " | ", curr])}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({
  dataset,
});
export default withContext(mapContextToProps)(DatasetAbout);
