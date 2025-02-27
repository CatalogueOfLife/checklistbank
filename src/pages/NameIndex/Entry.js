import React, {useEffect, useState} from "react";
import { LinkOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import { Row, Col, Switch, Tag } from "antd";
import withContext from "../../components/hoc/withContext";
import PresentationItem from "../../components/PresentationItem";
import BooleanValue from "../../components/BooleanValue";
import axios from "axios";
import config from "../../config";

const Authorship = ({author}) => {
    if(!author){
        return null;
    } else {
        return <>
        
            {author?.authors && author.authors.length > 0 && <>
                {author.authors.map(a => <Tag>{a}</Tag>)}
            </>}
            {author?.exAuthors && author.exAuthors.length > 0 && <>
                ex {author.exAuthors.map(a => <Tag>{a}</Tag>)}
            </>}

            {author?.year && <>, <Tag>{author?.year}</Tag></> }
        </>

    }   
}

const Entry = ({record}) => {
    const [asJson, setAsJson] = useState(false)

    return <>
    <Row><Col flex="auto"></Col><Col><Switch 
            style={{ marginBottom: "4px", marginTop: "4px" }}
            checkedChildren="JSON"
            unCheckedChildren="JSON"
            onChange={(checked) => {
              setAsJson(checked)
            }}/></Col></Row>
    {asJson ? <pre>{JSON.stringify(record, null, 2)}</pre> : <>
            <PresentationItem  label="ID">
              <NavLink to={{pathname: `/namesindex/${record.id}`}}>{record.id}</NavLink>
            </PresentationItem>
            <PresentationItem  label="Canonical ID">
              <NavLink to={{pathname: `/namesindex/${record.canonicalId}`}}>{record.canonicalId}</NavLink>              
            </PresentationItem>
            <PresentationItem  label="Scientific Name">
              {record.scientificName}
            </PresentationItem>
            <PresentationItem  label="rank">
              {record.rank}
            </PresentationItem>
            <PresentationItem  label="genus">
              {record.genus}
            </PresentationItem>
            <PresentationItem  label="uninomial">
              {record.uninomial}
            </PresentationItem>        
            <PresentationItem  label="Specific Epithet">
              {record.specificEpithet}
            </PresentationItem>
            <PresentationItem  label="Infraspecific Epithet">
              {record.infraspecificEpithet}
            </PresentationItem>
            <PresentationItem  label="Basionym Authorship">
               {record?.basionymAuthorship ? <Authorship author={record?.basionymAuthorship} /> : record?.basionymAuthorship}
            </PresentationItem>
            <PresentationItem  label="Combination Authorship">
               {record?.combinationAuthorship ? <Authorship author={record?.combinationAuthorship} /> : record?.combinationAuthorship}
            </PresentationItem>
            <PresentationItem  label="parsed">
            <BooleanValue value={record.parsed} />
            </PresentationItem>
            <PresentationItem  label="created">
              {record.created}
            </PresentationItem>
            <PresentationItem  label="modified">
              {record.modified}
            </PresentationItem>

            </>}</>

}

export default Entry;
export {Authorship};