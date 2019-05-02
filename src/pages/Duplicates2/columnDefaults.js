import React from "react";
import DecisionTag from '../WorkBench/DecisionTag'
import _ from "lodash";

import { NavLink } from "react-router-dom";

export default {
    binomial: [
        
         {
           title: "ID",
           dataIndex: "name.id",
           width: 60,
           className: "workbench-td",
           render: (text, record) => {
             return (
               <NavLink
                     key={_.get(record, "id")}
                     to={{
                       pathname: `/dataset/${_.get(record, "name.datasetKey")}/${
                         _.get(record, "bareName") ? "name" : "taxon"
                       }/${encodeURIComponent(
                          _.get(record, "name.id")
                       )}`
                     }}
                     exact={true}
                   >
                 {text}
               </NavLink>
             );
           },
         
         },
         {
           title: "Decision",
           dataIndex: "decisions",
           key: "decisions",
           width: 60,
           className: "workbench-td",
           render: (text, record) => {
           return <DecisionTag decision={_.get(record, 'decision')} deleteCallback={this.getData}/>}
         },
         {
           title: "Status",
           dataIndex: "status",
           key: "status",
           width: 90,
           className: "workbench-td",
       
         },
         {
            title: "Accepted",
            dataIndex: "accepted.name.formattedName",
            key: "accepted",
            width: 60,
            className: "workbench-td",
            render: (text, record) => {
            return <span dangerouslySetInnerHTML={{__html: _.get(record, "accepted.name.formattedName")}}></span>}
          },
        
         {
           title: "Genus",
           width: 160,
           dataIndex: "name.genus",
           key: "genus",
           className: "workbench-td",
         },
         {
           title: "specificEpithet",
           width: 160,
           dataIndex: "name.specificEpithet",
           key: "specificEpithet",
           className: "workbench-td",
         },
         {
           title: "Authorship",
           width: 240,
           dataIndex: "name.authorship",
           key: "authorship",
           className: "workbench-td",
         },
       
         {
           title: "Rank",
           width: 100,
           dataIndex: "name.rank",
           key: "rank",
           className: "workbench-td",
         }
       ],
       trinomial: [
        
        {
          title: "ID",
          dataIndex: "name.id",
          width: 60,
          className: "workbench-td",
          render: (text, record) => {
            return (
              <NavLink
                    key={_.get(record, "id")}
                    to={{
                      pathname: `/dataset/${_.get(record, "name.datasetKey")}/${
                        _.get(record, "bareName") ? "name" : "taxon"
                      }/${encodeURIComponent(
                         _.get(record, "name.id")
                      )}`
                    }}
                    exact={true}
                  >
                {text}
              </NavLink>
            );
          },
        
        },
        {
          title: "Decision",
          dataIndex: "decisions",
          key: "decisions",
          width: 60,
          className: "workbench-td",
          render: (text, record) => {
            console.log(_.get(record, 'decision'))
          return <DecisionTag decision={_.get(record, 'decision')} deleteCallback={this.getData}/>}
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          width: 90,
          className: "workbench-td",
      
        },
        {
            title: "Accepted",
            dataIndex: "accepted.name.formattedName",
            key: "accepted",
            width: 60,
            className: "workbench-td",
            render: (text, record) => {
            return <span dangerouslySetInnerHTML={{__html: _.get(record, "accepted.name.formattedName")}}></span>}
          },
        {
          title: "Genus",
          width: 160,
          dataIndex: "name.genus",
          key: "genus",
          className: "workbench-td",
        },
        {
          title: "specificEpithet",
          width: 160,
          dataIndex: "name.specificEpithet",
          key: "specificEpithet",
          className: "workbench-td",
        },
        {
          title: "infraspecificEpithet",
          width: 160,
          dataIndex: "name.infraspecificEpithet",
          key: "infraspecificEpithet",
          className: "workbench-td",
        },
        {
          title: "Authorship",
          width: 240,
          dataIndex: "name.authorship",
          key: "authorship",
          className: "workbench-td",
        },
      
        {
          title: "Rank",
          width: 100,
          dataIndex: "name.rank",
          key: "rank",
          className: "workbench-td",
        }
      ],
      uninomial: [
        
        {
          title: "ID",
          dataIndex: "name.id",
          width: 60,
          className: "workbench-td",
          render: (text, record) => {
            return (
              <NavLink
                    key={_.get(record, "id")}
                    to={{
                      pathname: `/dataset/${_.get(record, "name.datasetKey")}/${
                        _.get(record, "bareName") ? "name" : "taxon"
                      }/${encodeURIComponent(
                         _.get(record, "name.id")
                      )}`
                    }}
                    exact={true}
                  >
                {text}
              </NavLink>
            );
          },
        
        },
        {
          title: "Decision",
          dataIndex: "decisions",
          key: "decisions",
          width: 60,
          className: "workbench-td",
          render: (text, record) => {
            console.log(_.get(record, 'decision'))
          return <DecisionTag decision={_.get(record, 'decision')} deleteCallback={this.getData}/>}
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          width: 90,
          className: "workbench-td",
      
        },
        {
            title: "Accepted",
            dataIndex: "accepted.name.formattedName",
            key: "accepted",
            width: 60,
            className: "workbench-td",
            render: (text, record) => {
            return <span dangerouslySetInnerHTML={{__html: _.get(record, "accepted.name.formattedName")}}></span>}
          },
         {
           title: "Uninomial",
           width: 160,
           dataIndex: "name.uninomial",
           key: "uninomial",
           className: "workbench-td",
         }, 
        {
          title: "Authorship",
          width: 240,
          dataIndex: "name.authorship",
          key: "authorship",
          className: "workbench-td",
        },
      
        {
          title: "Rank",
          width: 100,
          dataIndex: "name.rank",
          key: "rank",
          className: "workbench-td",
        }
      ]
}