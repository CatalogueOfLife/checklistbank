import React from "react";
import config from "../../../config";
import axios from "axios";
import { Rate, Divider, Row, Col } from "antd";
import { NavLink } from "react-router-dom";
import _ from "lodash";
import PresentationItem from "../../../components/PresentationItem";
import marked from "marked";
import DOMPurify from "dompurify";
import withContext from "../../../components/hoc/withContext";

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
          {dataset && (
            <React.Fragment>
              <div>
                <PresentationItem label="Alias">
                  {dataset.alias}
                </PresentationItem>
                {/*               <PresentationItem label="Full name">
                {dataset.title}
              </PresentationItem> */}
                <PresentationItem label="Version">
                  {(dataset.version || dataset.released) &&
                    `${dataset.version ? dataset.version : ""}${
                      dataset.released ? " " + dataset.released : ""
                    }`}
                </PresentationItem>
                {dataset.authors && _.isArray(dataset.authors) && (
                  <PresentationItem label="Authors">
                    {dataset.authors.map((a) => a.name).join(", ")}
                  </PresentationItem>
                )}
                {dataset.editors && _.isArray(dataset.editors) && (
                  <PresentationItem label="Editors">
                    {dataset.editors.map((a) => a.name).join(", ")}
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
                  {dataset.group}
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

                <PresentationItem label="Organisation">
                  {_.isArray(dataset.organisations) &&
                    dataset.organisations.map((o) => <div>{o.label}</div>)}
                </PresentationItem>
                <PresentationItem label="Website">
                  {dataset.website && (
                    <a href={dataset.website} target="_blank">
                      {dataset.website}
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
                  {dataset.geographicScope || "-"}
                </PresentationItem>
                <PresentationItem label="Completeness">
                  {dataset.completeness}
                </PresentationItem>
                <PresentationItem label="Checklist Confidence">
                  {<Rate defaultValue={dataset.confidence} disabled></Rate>}
                </PresentationItem>
                <PresentationItem label={"DOI"}>{dataset.doi}</PresentationItem>
                <PresentationItem label="Citation">
                  {dataset.citation || "-"}
                </PresentationItem>

                <PresentationItem label="License">
                  {dataset.license || "-"}
                </PresentationItem>

                {dataset.gbifKey && (
                  <PresentationItem label="GBIF">
                    <a
                      href={`https://www.gbif.org/dataset/${dataset.gbifKey}`}
                      target="_blank"
                    >
                      Browse in GBIF
                    </a>
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
        </div>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ dataset }) => ({
  dataset,
});
export default withContext(mapContextToProps)(DatasetAbout);
