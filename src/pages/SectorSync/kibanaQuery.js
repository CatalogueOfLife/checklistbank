
import config from '../../config'

const {kibanaEnv} = config;
const kibanaQuery = (sectorKey, attempt) => `https://logs.gbif.org/app/kibana#/discover?_g=(refreshInterval:(display:On,pause:!f,value:0),time:(from:now-4h,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:sector,negate:!f,type:phrase,value:${sectorKey}),query:(match:(sector:(query:${sectorKey},type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:attempt,negate:!f,type:phrase,value:${attempt}),query:(match:(attempt:(query:${attempt},type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:environment,negate:!f,type:phrase,value:${kibanaEnv}),query:(match:(environment:(query:${kibanaEnv},type:phrase))))),index:AWGthDPVf8lu3pmEwvFE,interval:auto,query:(match_all:()),sort:!('@timestamp',desc))`

export default kibanaQuery