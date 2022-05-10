import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import linkify from 'linkify-html';
import {Tag, Row, Col} from "antd"

export const getTypeColor = (status) => {
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


const TypeMaterial = ({ data, nameID, style }) => {
  return (
    data[nameID] ? <div style={style}>
      {data[nameID].map(s => <BorderedListItem key={s.id}>
            <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag> {s?.citation && <span
                  dangerouslySetInnerHTML={{ __html: linkify(s?.citation)}}
                ></span>}
          </BorderedListItem>)
        }
    </div> : null
  );
};
export default TypeMaterial;
