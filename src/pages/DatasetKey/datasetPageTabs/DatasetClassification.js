import React from "react";

import config from "../../../config";
import _ from "lodash";
import history from "../../../history";

import PageContent from "../../../components/PageContent";
import ColTree from "../../Assembly/ColTree";
import { ColTreeContext } from "../../Assembly/ColTreeContext"
import queryString from "query-string";
import Auth from "../../../components/Auth";
import withContext from "../../../components/hoc/withContext"
import NameAutocomplete from "../../Assembly/NameAutocomplete"
import ColTreeActions from "../../Assembly/ColTreeActions"

class DatasetClassification extends React.Component {
  constructor(props) {
    super(props);
    
  }

  


  render() {
   
    const { dataset, location, user, catalogueKey } = this.props;
    const params = queryString.parse(this.props.location.search);

    return (
      <PageContent>
        
        {dataset && (
                    <NameAutocomplete
                      datasetKey={dataset.key}
                      onSelectName={name => {
                        history.push({
                          pathname: `/catalogue/${catalogueKey}/dataset/${dataset.key}/classification`,
                          search: `?${queryString.stringify({sourceTaxonKey: _.get(name, "key")})}`
                        });

                        ColTreeActions.refreshSource()
                      }}
                      onResetSearch={() => {
                        history.push({
                          pathname: `/catalogue/${catalogueKey}/dataset/${dataset.key}/classification`,
                        });
                      }}
                    />
                  )}
        <ColTreeContext.Provider
        value={{
          mode: "ATTACH",
          toggleMode: ()=>{},
          getSyncState: ()=>{ return {}},
          syncState: { idle: true}, // Assume queue is empty
          syncingSector: null,
          missingTargetKeys: {},
          selectedSourceDatasetKey: dataset.key
        }}
      >
        <ColTree 
          dataset={dataset} 
          treeType="gsd"
          catalogueKey={catalogueKey}
          defaultExpandKey={params.sourceTaxonKey}
          location={location}
          showSourceTaxon={sector => {
            if(Auth.isAuthorised(user, ["editor", "admin"])){
              const params = {
                sourceTaxonKey: _.get(sector, "subject.id"),
                assemblyTaxonKey: _.get(sector, "target.id"),
                datasetKey: dataset.key
              };
  
              history.push({
                pathname: `/assembly`,
                search: `?${queryString.stringify(params)}`
              });
            } else {
              
              history.push({
                pathname: `/catalogue/${catalogueKey}/dataset/${catalogueKey}/classification`,
                search: `?${queryString.stringify({sourceTaxonKey: _.get(sector, "target.id")})}`
              });
            }
            
          }}
           />
</ColTreeContext.Provider>
        
      </PageContent>
    );
  }
}

const mapContextToProps = ({user, catalogueKey}) => ({user, catalogueKey})
export default withContext(mapContextToProps)(DatasetClassification);
