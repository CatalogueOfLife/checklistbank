import React from "react";
import PropTypes from "prop-types";
import config from "../../config";

import axios from "axios";
import { Alert, Spin, Tag, Tooltip } from "antd";
import ErrorMsg from "../../components/ErrorMsg";

import Layout from "../../components/LayoutNew";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import PresentationGroupHeader from "../../components/PresentationGroupHeader";
import VerbatimPresentation from "../../components/VerbatimPresentation"
import BooleanValue from "../../components/BooleanValue";
import withContext from "../../components/hoc/withContext";

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

// author attributes are objects
const authorAttrs = [
  "combinationAuthorship",
  "basionymAuthorship",
  "sanctioningAuthor"
];

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

    const { issueMap } = this.props;
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
          {name && (
            <React.Fragment>
              {authorAttrs.map(a => {
                return name[a] ? (
                  <PresentationItem key={a} label={_.startCase(a)}>
                    {`${name[a].authors.join(", ")} ${
                      name[a].exAuthors
                        ? `ex ${name[a].exAuthors.join(", ")}`
                        : ""
                    } ${name[a].year ? name[a].year : ""}`}
                  </PresentationItem>
                ) : (
                  <PresentationItem key={a} label={a} />
                );
              })}
            </React.Fragment>
          )}
           {reference && (
            <PresentationItem key="publishedIn" label="Published In">
              {reference.citation}
            </PresentationItem>
          )}
          {name && (
            <React.Fragment>
              {nameAttrs.map(a => (
                <PresentationItem key={a} label={_.startCase(a)}>
                  {typeof name[a] === "boolean" ? (
                    <BooleanValue value={name[a]} />
                  ) : (
                    name[a]
                  )}
                </PresentationItem>
              ))}
            </React.Fragment>
          )}
         
            {_.get(name, 'verbatimKey') && <VerbatimPresentation verbatimKey={name.verbatimKey} datasetKey={name.datasetKey}></VerbatimPresentation>}

        </div>
      </Layout>
    );
  }
}
const mapContextToProps = ({ issueMap }) => ({ issueMap });

export default withContext(mapContextToProps)(NamePage);
