import config from "../../../config";

const { kibanaEnv } = config;
const kibanaQuery = (datasetKey, attempt) =>
  `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(level,logger_name,message),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:dataset,negate:!f,params:(query:'${datasetKey}'),type:phrase),query:(match_phrase:(dataset:'${datasetKey}')))),index:'${kibanaEnv.index}',interval:auto,query:(language:lucene,query:''),sort:!())`;

/*   `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(level,datasetKey,service,logger_name,message),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${
    kibanaEnv.index
  }',key:dataset,negate:!f,params:(query:'${datasetKey}'),type:phrase),query:(match_phrase:(dataset:'${datasetKey}')))${
    attempt
      ? `,('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:attempt,negate:!f,params:(query:'${attempt}'),type:phrase),query:(match_phrase:(attempt:'${attempt}'))))`
      : ""
  },index:'${
    kibanaEnv.index
  }',interval:auto,query:(language:kuery,query:''),sort:!())` */

export default kibanaQuery;
