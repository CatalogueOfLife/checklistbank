import React, {useState, useEffect} from "react";
import PresentationItem from "../../components/PresentationItem";
import PageContent from "../../components/PageContent";
import Verbatim from "../Taxon/Verbatim";

import axios from "axios";
import { Spin, Row, Col, Divider, Tabs } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import BooleanValue from "../../components/BooleanValue";
import linkify from 'linkify-html';

const {TabPane} = Tabs;
const md = 5;



const Reference = ({dataset, id, addError}) => {
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState(null)
    useEffect(() => {
        const init = async () => {
          setLoading(true)
          try {
            const res = await axios(`${config.dataApi}dataset/${dataset?.key}/reference/${id}`);
            if (res?.data) {
              setReference(res?.data);
            }
            setLoading(false)
          } catch (err) {
            addError(err);
            setLoading(false)

          }
         
          
        };
        if(dataset){
            init();
        }
      }, [id, dataset]);

      /*
      "citation": "string",
  "year": 0,
  "remarks": "string",
  "page": "string",
  "parsed": true
      */
    return  <PageContent>
        {loading && <Row><Col flex="auto"></Col><Col><Spin /></Col><Col flex="auto"></Col></Row>}
   {reference && <>
    <Tabs defaultActiveKey="1" tabBarExtraContent={null}>
    <TabPane tab="Reference" key="1">
        <PresentationItem md={md} label="ID">
              {reference?.id}
         </PresentationItem>
         <PresentationItem md={md} label="citation">
         {reference?.citation && (
               <span
                  dangerouslySetInnerHTML={{ __html: linkify(reference?.citation)}}
                ></span>
              )}
         </PresentationItem>
         <PresentationItem md={md} label="year">
              {reference?.year}
         </PresentationItem>
         <PresentationItem md={md} label="page">
              {reference?.page}
         </PresentationItem>
         <PresentationItem md={md} label="parsed">
             <BooleanValue value={reference.parsed}/>

         </PresentationItem>
         <PresentationItem md={md} label="remarks">
              {reference?.remarks}
         </PresentationItem>

         {reference?.csl && <> <Divider orientation="left">CSL</Divider>
        <pre>
            {JSON.stringify(reference.csl, null, 2)}
        </pre>
        </>}
            </TabPane>
            {reference?.verbatimKey &&  
    <TabPane tab="Verbatim" key="2">
       <Verbatim verbatimKey={reference.verbatimKey} />
      </TabPane>}
            </Tabs>
    </>}
    
    </PageContent>

}


const mapContextToProps = ({
    addError, dataset
  }) => ({ addError, dataset });
  
  export default withContext(mapContextToProps)(Reference);