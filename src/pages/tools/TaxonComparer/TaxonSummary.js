import React, { useEffect, useState } from "react";
import withContext from "../../../components/hoc/withContext";
import {
    Alert,
    Empty,
    Row,
    Col,
    Select,
    Popconfirm,
    Checkbox,
    Tag,
    Spin,
    Button,
    Tooltip,
    Slider
  } from "antd";

  import { withRouter } from "react-router-dom";
  import axios from "axios";
import config from "../../../config";

import TaxonBreakdown from "../../Taxon/TaxonBreakdown"
import Includes from "../../Taxon/Includes"



const TaxonSummary = ({datasetKey, dataset, taxon, onTaxonClick, addError}) => {
    const [includes, setIncludes] = useState([]);
    const [synonyms, setSynonyms] = useState([]);
    const [taxonID, setTaxonID] = useState(null)
    useEffect(()=>{
        if(taxon?.id !== taxonID){
            setTaxonID(taxon?.id)
            getIncludes()
        }
    }, [taxon])

  const  getIncludes = async () => {
    setIncludes([])
    setSynonyms([])
    try {
        const res = await  axios(
            `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${taxon?.id}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
          )
         setIncludes( _.get(res, "data.facets.rank", []))
        /*  const synres = await  axios(
            `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${taxon?.id}&facet=rank&status=synonym&limit=0`
          )
          setSynonyms( _.get(synres, "data.facets.rank", [])) */

    } catch (error) {
        setIncludes([])
       // setSynonyms([])
        addError(error)
    }
               
      };

    return <>
        <Row style={{width: "100%"}}>
        <TaxonBreakdown taxon={taxon} datasetKey={datasetKey} onTaxonClick={onTaxonClick}  dataset={dataset}/>
        </Row>
        <Row style={{width: "100%", marginTop: "12px"}}>
            <Col span={24}>
            <h4>Accepted taxa</h4>
            <Includes
                md={12}
                data={includes}
                taxon={taxon}
                datasetKey={datasetKey}
              />
            </Col>
            {/* <Col span={12}>
            <h4>Synonyms and misapplied names</h4>
            <Includes
                 md={12}
                data={synonyms}
                taxon={taxon}
                datasetKey={datasetKey}
              />
            </Col> */}</Row>
    </>

}

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(TaxonSummary));

