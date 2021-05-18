import React from "react";
import config from "../config";
import axios from "axios";
import { Skeleton } from "antd";
import PresentationItem from "./PresentationItem";
import { NavLink } from "react-router-dom";
const _ = require("lodash");

const getLivingTaxa = (metrics, rank) =>
  (_.get(metrics, `taxaByRankCount.${rank}`) || 0) -
  (_.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0);
const getExtinctTaxa = (metrics, rank) =>
  _.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0;

const MetricsPresentation = ({ metrics, rank, dataset, pathToSearch }) =>
  metrics && rank ? (
    <React.Fragment>
      <React.Fragment>
        <PresentationItem label={`Living species`}>
          {dataset && pathToSearch ? (
            <NavLink
              to={{
                pathname: pathToSearch,
                search: `?SECTOR_DATASET_KEY=${dataset.key}&rank=species&extinct=false&extinct=_NULL`,
              }}
            >
              {getLivingTaxa(metrics, "species").toLocaleString("en-GB")}
            </NavLink>
          ) : (
            getLivingTaxa(metrics, "species").toLocaleString("en-GB")
          )}
        </PresentationItem>
        <PresentationItem label={`Extinct species`}>
          {dataset && pathToSearch ? (
            <NavLink
              to={{
                pathname: pathToSearch,
                search: `?SECTOR_DATASET_KEY=${dataset.key}&rank=species&extinct=true`,
              }}
            >
              {getExtinctTaxa(metrics, "species").toLocaleString("en-GB")}
            </NavLink>
          ) : (
            getExtinctTaxa(metrics, "species").toLocaleString("en-GB")
          )}
        </PresentationItem>
      </React.Fragment>
      {metrics.taxaByRankCount &&
        Object.keys(metrics.taxaByRankCount)
          .filter((r) => rank.indexOf(r) < rank.indexOf("species"))
          .sort((a, b) => rank.indexOf(b) - rank.indexOf(a))
          .map((k) => (
            <PresentationItem label={`${_.startCase(k)}`} key={k}>
              {dataset && pathToSearch ? (
                <NavLink
                  to={{
                    pathname: pathToSearch,
                    search: `?SECTOR_DATASET_KEY=${dataset.key}&rank=${k}`,
                  }}
                >
                  {metrics.taxaByRankCount[k].toLocaleString("en-GB")}
                </NavLink>
              ) : (
                metrics.taxaByRankCount[k].toLocaleString("en-GB")
              )}
            </PresentationItem>
          ))}
      <PresentationItem label={"Synonyms"} key={"Synonyms"}>
        {dataset && pathToSearch ? (
          <NavLink
            to={{
              pathname: pathToSearch,
              search: `?SECTOR_DATASET_KEY=${dataset.key}&status=misapplied&status=synonym&status=ambiguous%20synonym`,
            }}
          >
            {(metrics.synonymCount || 0).toLocaleString("en-GB")}
          </NavLink>
        ) : (
          (metrics.synonymCount || 0).toLocaleString("en-GB")
        )}
      </PresentationItem>
      <PresentationItem label={"Vernacular names"} key={"vernaculars"}>
        {(metrics.vernacularCount || 0).toLocaleString("en-GB")}
      </PresentationItem>
      <PresentationItem label={"Total number of names"} key={"names"}>
        {dataset && pathToSearch ? (
          <NavLink
            to={{
              pathname: pathToSearch,
              search: `?SECTOR_DATASET_KEY=${dataset.key}`,
            }}
          >
            {(metrics.nameCount || 0).toLocaleString("en-GB")}
          </NavLink>
        ) : (
          (metrics.nameCount || 0).toLocaleString("en-GB")
        )}
      </PresentationItem>
    </React.Fragment>
  ) : (
    <PresentationItem label="">
      <Skeleton active paragraph={{ rows: 4 }} />
    </PresentationItem>
  );

class Metrics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      metrics: null,
      rank: null,
      loading: true,
    };
  }

  componentDidMount() {
    this.getData();
    this.getRank();
  }

  getData = () => {
    const { dataset, catalogueKey } = this.props;
    axios(
      `${config.dataApi}dataset/${catalogueKey}/source/${dataset.key}/metrics`
    ).then((res) => {
      this.setState({ metrics: res.data });
    });
  };

  getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      this.setState({ rank: res.data.map((r) => r.name) })
    );
  };
  render = () => (
    <MetricsPresentation
      {...this.state}
      dataset={this.props.dataset}
      pathToSearch={this.props.pathToSearch}
    />
  );
}

export default Metrics;
