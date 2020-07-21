
import React from "react";

import {
  notification,
  Select,
  Row,
  Col,
  Input
} from "antd";
import { SaveOutlined } from '@ant-design/icons';

import _ from "lodash";
import axios from "axios";
import config from "../../../config";

import SectorNote from "./SectorNote"
import withContext from "../../../components/hoc/withContext"

const {Option} = Select;



const SectorForm = ({sector, nomCode, entitytype, rank, onError}) => {

    const updateSectorCode = code => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, code: code}
          ) 
          .then(() => {
            notification.open({
              message: "Nom. code for sector updated",
              description: `New code is ${code}`
            });
          })
          .catch(err => {
              if(typeof onError === "function"){
                onError(err)
              }
          });
      }
    
      const updateParent = (parentName, targetOrSubject) => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, [targetOrSubject]: {...sector[targetOrSubject], parent: parentName}}
          ) 
          .then(() => {
            notification.open({
              message: `${targetOrSubject} parent configured`
            });
          })
          .catch(err => {
            if(typeof onError === "function"){
                onError(err)
              }
          });
      }

      const updateSectorRank = rank => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, rank: rank}
          ) 
          .then(() => {
            notification.open({
              message: "Ranks for sector configured"
            });
          })
          .catch(err => {
            if(typeof onError === "function"){
                onError(err)
              }
          });
      }

      const updatePlaceholderRank = rank => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, placeholderRank: rank}
          ) 
          .then(() => {
            notification.open({
              message: "Placeholder rank for sector configured"
            });
          })
          .catch(err => {
            if(typeof onError === "function"){
                onError(err)
              }
          });
      }
    
     const updateSectorNote = note => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, note: note}
          ) 
          .then(() => {
            notification.open({
              message: "Sector note updated:",
              description: note
            });
          })
          .catch(err => {
            if(typeof onError === "function"){
                onError(err)
              }
          });
      }
    
      const updateSectorEntities = entities => {
        axios
          .put(
            `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`, {...sector, entities: entities}
          ) 
          .then(() => {
            notification.open({
              message: "Sector entities updated"
            });
          })
          .catch(err => {
            if(typeof onError === "function"){
                onError(err)
              }
          });
      }

    return (<React.Fragment>
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
            Nom. code
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
        <Select style={{ width: '100%' }} defaultValue={sector.code} onChange={value => updateSectorCode(value)} showSearch allowClear>
    
      {nomCode.map((f) => {
        return <Option key={f.name} value={f.name}>{f.name}</Option>
      })}
    </Select>
    </Col>
        </Row> 
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
            Ranks
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
        <Select mode="multiple" style={{ width: '100%' }} defaultValue={sector.rank || []} onChange={value => updateSectorRank(value)} showSearch allowClear>
    
        {rank.map((r) => {
        return <Option key={r} value={r}>{r}</Option>
      })}
    </Select>
    </Col>
        </Row> 
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
            Placeholder rank
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
        <Select  style={{ width: '100%' }} defaultValue={sector.placeholderRank} onChange={value => updatePlaceholderRank(value)} showSearch allowClear>
    
        {rank.map((r) => {
        return <Option key={r} value={r}>{r}</Option>
      })}
    </Select>
    </Col>
        </Row> 
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
          Entities
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
        <Select mode="multiple" style={{ width: '100%' }} defaultValue={sector.entities || []} onChange={value => updateSectorEntities(value)} showSearch allowClear>
    
      {entitytype.map((f) => {
        return <Option key={f.name} value={f.name}>{f.name}</Option>
      })}
    </Select>
    </Col>
        </Row> 

        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
          Target parent
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
          <Input.Search 
            enterButton={<SaveOutlined />} 
            onSearch={parentName => updateParent(parentName, 'target')}
            defaultValue={_.get(sector, 'target.parent') || null} />
    </Col>
        </Row> 
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>
          Subject parent
          </Col>
          <Col span={15} style={{paddingLeft: '8px'}}>
          <Input.Search 
            enterButton={<SaveOutlined />} 
            onSearch={parentName => updateParent(parentName, 'subject')}
            defaultValue={_.get(sector, 'subject.parent') || null} />
    </Col>
        </Row> 


        <Row style={{ marginTop: "8px" }}>
        <SectorNote note={sector.note} onSave={updateSectorNote}></SectorNote>
        </Row>
        </React.Fragment>)
}


const mapContextToProps = ({ nomCode,  entitytype, rank }) => ({ nomCode, entitytype, rank });
export default withContext(mapContextToProps)(SectorForm)