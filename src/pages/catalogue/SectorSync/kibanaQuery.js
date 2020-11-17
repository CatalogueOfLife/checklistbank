import config from "../../../config";

const { kibanaEnv } = config;
const kibanaQuery = (sectorKey, attempt) =>
  !isNaN(attempt)
    ? `https://logs.gbif.org/app/discover#/?_g=(refreshInterval:(display:On,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!(),index:'${kibanaEnv.index}',interval:auto,query:(language:lucene,query:(query_string:(analyze_wildcard:!t,query:'sector:"${sectorKey}" AND attempt:"${attempt}"',time_zone:UTC))),sort:!('@timestamp',desc))`
    : `https://logs.gbif.org/app/discover#/?_g=(refreshInterval:(display:On,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!(),index:'${kibanaEnv.index}',interval:auto,query:(language:lucene,query:(query_string:(analyze_wildcard:!t,query:'sector:"${sectorKey}"',time_zone:UTC))),sort:!('@timestamp',desc))`;
export default kibanaQuery;
