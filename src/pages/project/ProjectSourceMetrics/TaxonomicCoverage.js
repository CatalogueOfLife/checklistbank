import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import config from "../../../config";
import axios from "axios";
import _ from "lodash";

const TaxonomicCoverage = ({ dataset, projectKey, style, isProject }) => {
  const [taxonMap, setTaxonMap] = useState(null);

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    const taxonMapLocal = {};
    axios(
      `${config.dataApi}dataset/${projectKey}/sector?limit=1000&subjectDatasetKey=${dataset.key}`
    ).then((res) => {
      return Promise.all(
        res.data.result.map((t) =>
          axios(
            `${
              config.dataApi
            }dataset/${projectKey}/nameusage/search?TAXON_ID=${
              t.target ? t.target.id : ""
            }&rank=${t.subject ? t.subject.rank : ""}&q=${
              t.subject ? t.subject.name : ""
            }&limit=2`
          ).then((usages) => {
            const taxon = _.get(usages, "data.result[0]");
            if (taxon) {
              const path = taxon.classification
                .slice(1, taxon.classification.length - 1)
                .map((t) => t.name)
                .join(" > ");
              if (taxonMapLocal[path]) {
                taxonMapLocal[path].push(
                  taxon.classification[taxon.classification.length - 1]
                );
              } else {
                taxonMapLocal[path] = [
                  taxon.classification[taxon.classification.length - 1],
                ];
              }
            }
          })
        )
      ).then(() => setTaxonMap(taxonMapLocal));
    });
  };

  return taxonMap
    ? Object.keys(taxonMap).map((k) => (
        <div style={style}>
          <span>{k}:</span>{" "}
          {taxonMap[k].map((tx, idx) => (
            <>
              <NavLink
                to={{
                  pathname: isProject
                    ? `/project/${projectKey}/assembly`
                    : `/dataset/${projectKey}/classification`,
                  search: isProject
                    ? `?assemblyTaxonKey=${tx.id}`
                    : `?taxonKey=${tx.id}`,
                }}
              >
                {tx.name}
              </NavLink>
              {idx !== taxonMap[k].length - 1 ? ", " : ""}
            </>
          ))}
        </div>
      ))
    : null;
};

export default TaxonomicCoverage;
