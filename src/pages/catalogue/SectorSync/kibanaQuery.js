import config from "../../../config";

const { kibanaEnv } = config;
const kibanaQuery = (sectorKey, attempt) =>
  `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(level,sectorKey,service,logger_name,message),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${
    kibanaEnv.index
  }',key:sector,negate:!f,params:(query:'${sectorKey}'),type:phrase),query:(match_phrase:(sector:'${sectorKey}')))${
    attempt
      ? `,('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${kibanaEnv.index}',key:attempt,negate:!f,params:(query:'${attempt}'),type:phrase),query:(match_phrase:(attempt:'${attempt}'))))`
      : ""
  },index:'${
    kibanaEnv.index
  }',interval:auto,query:(language:kuery,query:''),sort:!())`;
export default kibanaQuery;
