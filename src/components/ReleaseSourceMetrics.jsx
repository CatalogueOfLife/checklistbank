import { useEffect, useState } from "react";
import config from "../config";
import axios from "axios";
import { Skeleton } from "antd";
import PresentationItem from "./PresentationItem";
import { NavLink } from "react-router-dom";
import _ from "lodash";

const getLivingTaxa = (metrics, rank) =>
  (_.get(metrics, `taxaByRankCount.${rank}`) || 0) -
  (_.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0);
const getExtinctTaxa = (metrics, rank) =>
  _.get(metrics, `extinctTaxaByRankCount.${rank}`) || 0;

const MetricsPresentation = ({ metrics, rank, dataset, pathToSearch }) =>
  metrics && rank ? (
    <>
      <>
        <PresentationItem label={`Living species`}>
          {dataset && pathToSearch ? (
            <NavLink
              to={{
                pathname: pathToSearch,
                search: `?SECTOR_DATASET_KEY=${dataset?.key}&rank=species&extinct=false&extinct=_NULL`,
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
                search: `?SECTOR_DATASET_KEY=${dataset?.key}&rank=species&extinct=true`,
              }}
            >
              {getExtinctTaxa(metrics, "species").toLocaleString("en-GB")}
            </NavLink>
          ) : (
            getExtinctTaxa(metrics, "species").toLocaleString("en-GB")
          )}
        </PresentationItem>
      </>
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
                    search: `?SECTOR_DATASET_KEY=${dataset?.key}&rank=${k}`,
                  }}
                >
                  {metrics.taxaByRankCount[k].toLocaleString("en-GB")}
                </NavLink>
              ) : (
                metrics.taxaByRankCount[k].toLocaleString("en-GB")
              )}
            </PresentationItem>
          ))}
      <PresentationItem label={"Synonyms and combinations"} key={"Synonyms"}>
        {dataset && pathToSearch ? (
          <NavLink
            to={{
              pathname: pathToSearch,
              search: `?SECTOR_DATASET_KEY=${dataset?.key}&status=misapplied&status=synonym&status=ambiguous%20synonym`,
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
              search: `?SECTOR_DATASET_KEY=${dataset?.key}`,
            }}
          >
            {(metrics.nameCount || 0).toLocaleString("en-GB")}
          </NavLink>
        ) : (
          (metrics.nameCount || 0).toLocaleString("en-GB")
        )}
      </PresentationItem>
    </>
  ) : (
    <PresentationItem label="">
      <Skeleton active paragraph={{ rows: 4 }} />
    </PresentationItem>
  );

const Metrics = ({ dataset, projectKey, pathToSearch }) => {
  const [metrics, setMetrics] = useState(null);
  const [rank, setRank] = useState(null);

  useEffect(() => {
    axios(
      `${config.dataApi}dataset/${projectKey}/source/${dataset?.key}/metrics`
    ).then((res) => {
      setMetrics(res.data);
    });

    axios(`${config.dataApi}vocab/rank`).then((res) =>
      setRank(res.data.map((r) => r.name))
    );
  }, []);

  return (
    <MetricsPresentation
      metrics={metrics}
      rank={rank}
      dataset={dataset}
      pathToSearch={pathToSearch}
    />
  );
};

export default Metrics;
