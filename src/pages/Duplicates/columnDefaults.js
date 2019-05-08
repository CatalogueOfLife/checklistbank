import React from "react";
import DecisionTag from '../WorkBench/DecisionTag'
import _ from "lodash";
import Classification from './Classification'
import { NavLink } from "react-router-dom";
import CopyableColumnText from '../WorkBench/CopyableColumnText'
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
                 <CopyableColumnText text={text} width="50px"/>
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
           width: 60,
           className: "workbench-td",
           render: (text, record) => <CopyableColumnText text={text} width="50px"/>
       
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
           render: (text, record) => <CopyableColumnText text={text} width="150px"/>

         },
         {
           title: "specificEpithet",
           width: 160,
           dataIndex: "name.specificEpithet",
           key: "specificEpithet",
           className: "workbench-td",
           render: (text, record) => <CopyableColumnText text={text} width="150px"/>

         },
         {
           title: "Authorship",
           width: 240,
           dataIndex: "name.authorship",
           key: "authorship",
           className: "workbench-td",
           render: (text, record) => <CopyableColumnText text={text} width="230px"/>

         },
       
         {
           title: "Rank",
           width: 60,
           dataIndex: "name.rank",
           key: "rank",
           className: "workbench-td",
           render: (text, record) => <CopyableColumnText text={text} width="50px"/>

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
                 <CopyableColumnText text={text} width="50px"/>
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
          width: 60,
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="50px"/>

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
          render: (text, record) => <CopyableColumnText text={text} width="150px"/>

        },
        {
          title: "specificEpithet",
          width: 160,
          dataIndex: "name.specificEpithet",
          key: "specificEpithet",
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="150px"/>

        },
        {
          title: "infraspecificEpithet",
          width: 160,
          dataIndex: "name.infraspecificEpithet",
          key: "infraspecificEpithet",
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="150px"/>

        },
        {
          title: "Authorship",
          width: 240,
          dataIndex: "name.authorship",
          key: "authorship",
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="230px"/>

        },
      
        {
          title: "Rank",
          width: 60,
          dataIndex: "name.rank",
          key: "rank",
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="50px"/>

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
                <CopyableColumnText text={text} width="50px"/>
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
          width: 60,
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="50px"/>

        },
     /*   {
            title: "Accepted",
            dataIndex: "accepted.name.formattedName",
            key: "accepted",
            width: 60,
            className: "workbench-td",
            render: (text, record) => {
            return <span dangerouslySetInnerHTML={{__html: _.get(record, "accepted.name.formattedName")}}></span>}
        }, */
         {
           title: "Uninomial",
           width: 160,
           dataIndex: "name.uninomial",
           key: "uninomial",
           className: "workbench-td",
           render: (text, record) => <CopyableColumnText text={text} width="140px"/>

         }, 
         
     /*   {
          title: "Authorship",
          width: 240,
          dataIndex: "name.authorship",
          key: "authorship",
          className: "workbench-td",
        }, */
      
        {
          title: "Rank",
          width: 60,
          dataIndex: "name.rank",
          key: "rank",
          className: "workbench-td",
          render: (text, record) => <CopyableColumnText text={text} width="50px"/>

        },
        {
          title: "Classification",
          width: 160,
          dataIndex: "classification",
          className: "workbench-td",
          render: (text, record) => {
            return _.get(record, 'classification') ? <Classification path={_.get(record, 'classification')}></Classification> : ''}
        }
      ]
}