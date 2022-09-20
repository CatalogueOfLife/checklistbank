import React from "react";
import config from "../../config";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import linkify from 'linkify-html';
import {Tag, Space, Tooltip} from "antd"
import withContext from "../../components/hoc/withContext";
import {IconContext} from "react-icons"
import { GiDna1 } from "react-icons/gi";
import {GbifLogoIcon} from "../../components/Icons"
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

const getLinks = (dataset, s) => {
  const gbifOccLink = dataset?.gbifKey && dataset?.gbifPublisherKey === config?.plaziGbifPublisherKey ? `https://www.gbif.org/occurrence/${dataset?.gbifKey}/${s.id}` : '';
  const ncbiLink = s?.associatedSequences && s?.associatedSequences.indexOf('ncbi.') > -1 ? s?.associatedSequences : '';
  return (gbifOccLink || ncbiLink) && <span>
    <Space>{gbifOccLink && <Tooltip title="Occurrence in GBIF"><a  href={gbifOccLink}><IconContext.Provider value={{ color: "green"}}><GbifLogoIcon /></IconContext.Provider></a></Tooltip>}{ncbiLink && <Tooltip title="DNA sequence in GenBank"><a href={ncbiLink}><IconContext.Provider value={{ color: "black", size: "16"}}><GiDna1 /></IconContext.Provider></a></Tooltip>}</Space>
    </span>

    
}

const TypeMaterial = ({dataset, data, nameID, style }) => {
  return (
    data[nameID] ? <div style={style}>
      {data[nameID].map(s => <BorderedListItem key={s.id}>
            <Tag color={getTypeColor(s?.status)}>{s?.status}</Tag>{getLinks(dataset,s)} {s?.citation && <span
                  dangerouslySetInnerHTML={{ __html: linkify(s?.citation)}}
                ></span>}
                
          </BorderedListItem>)
        }
    </div> : null
  );
};

const mapContextToProps = ({
  dataset
}) => ({
  dataset
});

export default withContext(mapContextToProps)(TypeMaterial);
