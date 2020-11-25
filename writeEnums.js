// import axiosInstance from './util/axiosInstance';
const axios = require("axios");
const config = require("./src/env").prod;
const fs = require("fs");
const enums = [
  "frequency",
  "datasettype",
  "dataformat",
  "datasetorigin",
  "rank",
  "taxonomicstatus",
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
  "estimatetype",
  "setting",
  "Gazetteer",
  "entitytype",
];

const writeEnums = () => {
  console.log(
    `Retrieving enumerations from ${config.env} API: ${config.dataApi}`
  );
  enums.map((e) =>
    axios(`${config.dataApi}vocab/${e}`).then(({ data }) =>
      fs.writeFile(
        `${__dirname}/src/enumeration/${e}.json`,
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) throw err;
          console.log(`Writing ${e}.json`);
        }
      )
    )
  );
};

writeEnums();
