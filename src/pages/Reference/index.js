import React, {useState, useEffect} from "react";
import PresentationItem from "../../components/PresentationItem";
import PageContent from "../../components/PageContent";
import Verbatim from "../Taxon/Verbatim";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { Spin, Row, Col, Divider, Tabs } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import BooleanValue from "../../components/BooleanValue";
import AgentPresentation from "../../components/MetaData/AgentPresentation";
import linkify from 'linkify-html';
import _ from 'lodash';

const {TabPane} = Tabs;
const md = 5;

const isCslPerson = (entity) => {
 return !!(_.get(entity, '[0].family') || _.get(entity, '[0].isInstitution'));
}


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

    return  <PageContent>
        {loading && <Row><Col flex="auto"></Col><Col><Spin /></Col><Col flex="auto"></Col></Row>}
   {reference && <>
    {reference?.citation &&   <h1 dangerouslySetInnerHTML={{ __html: linkify(reference?.citation)}}></h1>}

    <Tabs defaultActiveKey="1" tabBarExtraContent={null}>
    <TabPane tab="Reference" key="1">
        <PresentationItem md={md} label="id">
              {reference?.id}
         </PresentationItem>
{/*          <PresentationItem md={md} label="citation">
         {reference?.citation && (
               <span
                  dangerouslySetInnerHTML={{ __html: linkify(reference?.citation)}}
                ></span>
              )}
         </PresentationItem> */}
         <PresentationItem md={md} label="year">
              {reference?.year}
         </PresentationItem>
         <PresentationItem md={md} label="page">
              {reference?.page}
         </PresentationItem>
         <PresentationItem md={md} label="parsed">
             <BooleanValue value={reference.parsed}/>

         </PresentationItem>
         

         {reference?.csl && <>
           
                {Object.keys(reference.csl).filter(key => !['id'].includes(key)).map(key => {
                    if(key === 'URL' && reference.csl[key]){
                        return <PresentationItem md={md} label={key}>
                        {
                        <span
                        dangerouslySetInnerHTML={{ __html: linkify(reference.csl[key])}}
                      ></span>}
                   </PresentationItem>
                    }
                    if(typeof reference.csl[key] === 'string'){
                        return <PresentationItem md={md} label={key}>
                        {reference.csl[key]}
                   </PresentationItem>
                    } else if(reference.csl[key] && _.get(reference, `csl[${key}]["date-parts"]`)){
                        return <PresentationItem md={md} label={key}>
                                {reference.csl[key]["date-parts"].map(part => _.get(part, '[0]', '')).join('-')}
                            </PresentationItem>
                    } else if(isCslPerson(reference.csl[key])){
                        return <PresentationItem md={md} label={key}>
                                <Row>
                                {reference.csl[key].map(person => <Col style={{paddingRight: "6px"}}> <AgentPresentation agent={person} /></Col>)}
                                </Row>
                            </PresentationItem>
                    }
                })}
            
        </>}
        <PresentationItem md={md} label="remarks">
              {reference?.remarks}
         </PresentationItem>
         <PresentationItem md={md} label="">
              <NavLink to={{pathname: `/dataset/${dataset?.key}/names`, search: `?PUBLISHED_IN_ID=${reference?.id}`}}>
              Names associated with this reference
              </NavLink>
         </PresentationItem>
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