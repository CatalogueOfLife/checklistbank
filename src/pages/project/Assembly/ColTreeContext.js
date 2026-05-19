import React from "react";
import axios from "axios";
import config from "../../../config";
// NOTE: notification here is kept as static because applyDecision is a module-level
// function (not a component), so App.useApp() cannot be used here.
import { notification } from "antd";

export const applyDecision = (taxon, projectKey, cb) => {

  const { datasetKey } = taxon;
  //this.setState({ postingDecisions: true });

  return axios(
    `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(taxon, "id")}`
  )
    .then((tx) => {
      return Promise.all([
        tx,
        axios(
          `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(
            tx,
            "data.parentId"
          )}`
        ),
      ]);
    })

    .then((taxa) => {
      const tx = taxa[0].data;
      const parent = taxa[1].data;
      return axios.post(`${config.dataApi}dataset/${projectKey}/decision`, {
        subjectDatasetKey: datasetKey,
        subject: {
          id: _.get(tx, "id"),

          name: _.get(tx, "name.scientificName"), //.replace(/(<([^>]+)>)/ig , "")
          authorship: _.get(tx, "name.authorship"),
          rank: _.get(tx, "name.rank"),
          status: _.get(tx, "status"),
          parent: _.get(parent, "name.scientificName"),
          code: _.get(tx, "name.code"),
        },
        mode: "block",
      });
    })
    .then((decisionId) =>
      axios(
        `${config.dataApi}dataset/${projectKey}/decision/${decisionId.data}`
      )
    )
    .then((res) => {
      taxon.decision = res.data;

      notification.open({
        message: `Decision applied`,
        description: `${_.get(taxon, "name").replace(
          /(<([^>]+)>)/gi,
          ""
        )} was blocked from the project`,
      });
      if (typeof cb === "function") {
        cb(res.data);
      }
      //this.setState({popOverVisible: false})
    })
    .catch((err) => {
      notification.error({
        message: "Error",
        description: err.message,
      });
    });
};

export const ColTreeContext = React.createContext({
  mode: "attach",
  selectedSourceDatasetKey: null,
  assemblyTaxonKey: null,
  sourceTaxonKey: null,
  toggleMode: () => {},
  selectedSourceTreeNodes: [],
  selectedAssemblyTreeNodes: [],
  applyDecision: applyDecision
});
