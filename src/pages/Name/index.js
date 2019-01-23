import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import { Alert, Spin, Tag} from "antd";
import ErrorMsg from "../../components/ErrorMsg";

import Layout from "../../components/LayoutNew";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import PresentationGroupHeader from "../../components/PresentationGroupHeader";
import withContext from "../../components/hoc/withContext"

const nameAttrs = [
  "id",
  "datasetKey",
  "homotypicNameId",
  "indexNameId",
  "rank",
  "scientificName",
  "uninomial",
  "genus",
  "infragenericEpithet",
  "specificEpithet",
  "infraspecificEpithet",
  "cultivarEpithet",
  "strain",
  "candidatus",
  "notho",
  "authorship",
  "code",
  "nomStatus",
  "publishedInId",
  "publishedInPage",
  "origin",
  "type",
  "sourceUrl",
  "fossil",
  "remarks"
];

const authorAttrs = [
  "combinationAuthorship",
  "basionymAuthorship",
  "sanctioningAuthor",
]

class NamePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataset: null,
      name: null,
      verbatim: null,
      nameLoading: true,
      datasetLoading: true,
      verbatimLoading: true,
      nameError: null,
      datasetError: null,
      verbatimError: null
    };
  }

  componentWillMount() {
    this.getDataset();
    this.getName();
  }

  getDataset = () => {
    const {
      match: {
        params: { key }
      }
    } = this.props;

    this.setState({ datasetLoading: true });
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
  getReference = referenceKey => {
    const {
      match: {
        params: { key }
      }
    } = this.props;

    axios(
      `${config.dataApi}dataset/${key}/reference/${encodeURIComponent(
        referenceKey
      )}`
    )
      .then(res => {
        this.setState({
          referenceLoading: false,
          reference: res.data,
          referenceError: null
        });
      })
      .catch(err => {
        this.setState({
          referenceLoading: false,
          referenceErrorError: err,
          name: null
        });
      });
  };
  getName = () => {
    const {
      match: {
        params: { key, nameKey }
      }
    } = this.props;

    this.setState({ nameLoading: true });
    axios(`${config.dataApi}dataset/${key}/name/${encodeURIComponent(nameKey)}`)
      .then(res => {
        this.setState(
          { nameLoading: false, name: res.data, nameError: null },
          () => {
            this.getVerbatim(res.data.verbatimKey);
            if (res.data.publishedInId) {
              this.getReference(res.data.publishedInId);
            }
          }
        );
      })
      .catch(err => {
        this.setState({ nameLoading: false, nameError: err, name: null });
      });
  };
  getVerbatim = verbatimKey => {
    const {
      match: {
        params: { key }
      }
    } = this.props;

    this.setState({ verbatimLoading: true });
    axios(
      `${config.dataApi}dataset/${key}/verbatim/${encodeURIComponent(
        verbatimKey
      )}`
    )
      .then(res => {
        this.setState({
          verbatimLoading: false,
          verbatim: res.data,
          verbatimError: null
        });
      })
      .catch(err => {
        this.setState({
          verbatimLoading: false,
          verbatimError: err,
          verbatim: null
        });
      });
  };

  render() {
    const {
      datasetLoading,
      nameLoading,
      verbatimLoading,
      dataset,
      name,
      reference,
      verbatim,
      nameError,
      datasetError,
      verbatimError
    } = this.state;
    
    const {issueMap} = this.props
    return (
      <Layout
        selectedMenuItem="datasetKey"
        selectedDataset={dataset}
        selectedName={name}
        openKeys={["dataset", "datasetKey"]}
        selectedKeys={["name"]}
      >
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0"
          }}
        >
          {name && (
            <h1>
              Name details: {name.scientificName} {name.authorship}
            </h1>
          )}

          {nameLoading && <Spin />}
          {nameError && (
            <Alert message={<ErrorMsg error={nameError} />} type="error" />
          )}
          {
            name && (
              <React.Fragment>
                {authorAttrs.map(a => { return name[a] ? 
                 <PresentationItem key={a} label={a}>
                    {`${name[a].authors.join(", ")} ${name[a].year}`}
                  </PresentationItem> : 
                  <PresentationItem key={a} label={a}/>
                })}
              </React.Fragment>
            )
            
          }
          {name && (
            <React.Fragment>
              {nameAttrs.map(a => (
                <PresentationItem key={a} label={a}>
                  {name[a]}
                </PresentationItem>
              ))}
            </React.Fragment>
          )}
          {reference && (
            <PresentationItem key="reference" label="reference">
              {reference.citation}
            </PresentationItem>
          )}
          <PresentationGroupHeader title="verbatim" />
          {verbatimLoading && <Spin />}
          {verbatimError && (
            <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
          )}
          {_.get(verbatim, "issues") && verbatim.issues.length > 0 && (
            <PresentationItem label="Issues and flags">
             <div>{verbatim.issues.map(i => (
                <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                  {i}
                </Tag>
              ))}</div> 
            </PresentationItem>
          )}
          {_.get(verbatim, "terms") &&
            Object.keys(verbatim.terms).map(t => (
              <PresentationItem key={t} label={t}>
                {verbatim.terms[t]}
              </PresentationItem>
            ))}
        </div>
      </Layout>
    );
  }
}
const mapContextToProps = ({ issueMap }) => ({ issueMap });

export default withContext(mapContextToProps)(NamePage);
