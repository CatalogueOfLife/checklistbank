import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import linkify from 'linkify-html';
import {Tag} from "antd"

const getTypeColor = (status) => {
    const typeStatus = status ? status.toUpperCase() : "";

    if (['HOLOTYPE', 'LECTOTYPE', 'NEOTYPE'].includes(typeStatus)){
        return '#e2614a'
    }
    if (['PARATYPE', 'PARALECTOTYPE', 'SYNTYPE'].includes(typeStatus)){
        return '#f1eb0b'
    }
    if (['ALLOTYPE'].includes(typeStatus)){
        return '#7edaff'
    }
    return null
}


const TypeMaterial = ({ data, style }) => {
  return (
    <div style={style}>
      {_.values(data)
        
        .map(j => 
          j.map(s => <BorderedListItem key={s.id}>
            <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag> <span
                  dangerouslySetInnerHTML={{ __html: linkify(s?.citation)}}
                ></span>
          </BorderedListItem>)
        )}
    </div>
  );
};

export default TypeMaterial;
