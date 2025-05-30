// import axiosInstance from './util/axiosInstance';
const axios = require("axios");
const config = require("./src/env");
const _ = require("lodash");

const fs = require("fs");
const enums = [
  "frequency",
  "datasettype",
  "dataformat",
  "datasetorigin",
  "rank",
  "taxonomicstatus",
  "infoGroup",
  "taxGroup",
  "issue",
  "nametype",
  "namefield",
  "nomstatus",
  "license",
  "nomcode",
  "importstate",
  "environment",
  "importstate",
  "country",
  "language",
  "estimatetype",
  "setting",
  "Gazetteer",
  "entitytype",
  "speciesinteractiontype",
  "doiresolution"
];

let env;
try {
  console.log("process.env.NODE_ENV: " + process?.env?.NODE_ENV);
  env = _.get(config, process?.env?.NODE_ENV, config.prod);
} catch (err) {
  env = config.prod;
}

const writeEnums = () => {
  console.log(`Retrieving enumerations from ${env.env} API: ${env.dataApi}`);
  enums.map((e) =>
    axios(`${env.dataApi}vocab/${e}`).then(({ data }) =>
      fs.writeFile(
        `${__dirname}/src/enumeration/${e}.json`,
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) throw err;
          console.log(`Writing ${e}.json`);
        }
      )
    ).catch(error => {

      console.log(`Error retrieving ${e}`)
      console.log(`Status ${error?.response?.status} ${error?.response?.statusText}`)

    })
  );
};

writeEnums();
