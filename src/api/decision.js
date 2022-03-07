import axios from "axios";
import config from "../config";
import _ from "lodash"
const getDecisionObject = (data) => {
    const {datasetKey, subjectDatasetKey, taxon, parent, mode, updatedTaxon, updatedName} = data;
    const body = {
        datasetKey,
        subjectDatasetKey,
        subject: {
          id: taxon?.id,
          parent,      
          name: taxon?.name?.scientificName,
          authorship: taxon?.name?.authorship,
          rank: taxon?.name?.rank,
          status: taxon?.status
        },
        mode
      };
      if(mode === "update" && updatedName){
        body.name = {...taxon.name, ...updatedName}
      }
      if(mode === "update" && updatedTaxon){
          if(updatedTaxon.hasOwnProperty('environment') && _.isArray(updatedTaxon.environment)){
              body.environment = updatedTaxon.environment
          }
          if(updatedName.hasOwnProperty('extinct')){
              body.extinct = updatedTaxon.extinct
          }
          if(updatedName.hasOwnProperty('status')){
            body.status = updatedTaxon.status
        }
      }
      return body;
}
/*
* parent - taxon name of the subjects parent (for later rematch)
* updatedName - an object with name attributes that should be overwritten be the decision, only works for mode === "UPDATE"
* updatedTaxon - an object with taxon attributes that should be overwritten be the decision, only works for mode === "UPDATE" (example: status: SYNONYM)
*
*/
export const createDecision = async (data) => {
    const decision = getDecisionObject(data)
    return axios.post(
        `${config.dataApi}dataset/${datasetKey}/decision`,
        decision
      )
      
  };
export const updateDecision = async (data, id) => {
    const decision = getDecisionObject(data)
    return axios.put(
        `${config.dataApi}dataset/${datasetKey}/decision/${id}`,
        decision
      )    
  };
export const deleteDecision = async (id) => {
    return axios.delete(
        `${config.dataApi}dataset/${datasetKey}/decision/${id}`)
  };