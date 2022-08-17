import config from "../../../config";
const { kibanaEnv } = config;
const kibanaQuery = (jobID) => `https://logs.gbif.org/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-90d,to:now))&_a=(columns:!(level,logger_name,message),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${
    kibanaEnv.index
  }',key:job.keyword,negate:!f,params:(query:'${jobID}'),type:phrase),query:(match_phrase:(job.keyword:'${jobID}')))),index:'${
    kibanaEnv.index
  }',interval:auto,query:(language:lucene,query:''),sort:!())`

export default kibanaQuery;