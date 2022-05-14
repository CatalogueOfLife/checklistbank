import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import linkify from 'linkify-html';
import { NavLink } from "react-router-dom";
import { LinkOutlined } from "@ant-design/icons";

const ReferencesTable = ({ data, style }) => {
  return (
    <div style={style}>
      {_.values(data)
        
        .map(s => (
          <BorderedListItem key={s.id}>
            <NavLink to={{pathname: `/dataset/${s?.datasetKey}/reference/${encodeURIComponent(s?.id)}`}}>
              <LinkOutlined />
              </NavLink> <span
                  dangerouslySetInnerHTML={{ __html: linkify(s?.citation)}}
                ></span>
          </BorderedListItem>
        ))}
    </div>
  );
};

export default ReferencesTable;
