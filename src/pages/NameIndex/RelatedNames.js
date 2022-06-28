import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { NavLink, withRouter } from "react-router-dom";
import { Button, Row, Col, Tooltip, Table } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import axios from "axios";
import config from "../../config";
import Classification from "../NameSearch/Classification";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
import { truncate } from "../../components/util";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));


import _ from "lodash";

const decorateWithDataset = (res) => {
    if (!res?.data?.result) return res;
    return Promise.all([
      ...res.data.result.map((usage) =>
        datasetLoader
          .load(usage.datasetKey)
          .then((dataset) => (usage.dataset = dataset))
      )
    ]).then(() => res);
  };

const columns = [
    {
        title: "Dataset",
        dataIndex: ["dataset", "title"],
        key: "datasetLabel",
        render: (text, record) => (
          <NavLink
            key={_.get(record, "id")}
            to={{
              pathname: `/dataset/${_.get(record, "datasetKey")}`,
            }}
            exact={true}
          >
              <Tooltip title={text}>
            {truncate(text, 25)} {record?.dataset?.version ? `[${record?.dataset?.version}]` : ""}
            </Tooltip>
          </NavLink>
        ),
        
      },
    {
      title: "Scientific Name",
      dataIndex: ["labelHtml"],
      key: "scientificName",
      render: (text, record) => {
        const uri =
          !_.get(record, "id") ||
          record?.bareName ||
          !_.get(record, "status")
            ? `/dataset/${_.get(record, "datasetKey")}/name/${encodeURIComponent(_.get(record, "name.id"))}`
            : `/dataset/${_.get(record, "datasetKey")}/taxon/${encodeURIComponent(
                _.get(record, "accepted.id")
                  ? _.get(record, "accepted.id")
                  : _.get(record, "id")
              )}`;
  
        return (
          <NavLink
            key={_.get(record, "id")}
            to={{
              pathname: uri,
            }}
            exact={true}
          >
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </NavLink>
        );
      },
    },
    {
      title: "Status",
      dataIndex: [ "status"],
      key: "status",
      width: 200,
      render: (text, record) => {
        return !["synonym", "ambiguous synonym", "misapplied"].includes(text) ? (
          text
        ) : (
          <React.Fragment key={_.get(record, "id")}>
            {text} {text === "misapplied" ? "to " : "of "}
            <span
              dangerouslySetInnerHTML={{
                __html: _.get(record, "accepted.labelHtml"),
              }}
            />
          </React.Fragment>
        );
      },
    },
    {
      title: "Rank",
      dataIndex: ["name", "rank"],
      key: "rank",
      width: 60,
    }
  ];

const RelatedNames = ({ match, addError }) => {
    const [related, setRelated] = useState({result: []})
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        const init = async () => {
            setRelated(null)
            setLoading(true)
          const {
            params: { key },
          } = match;
          
          try {
            const relatedres = await axios(`${config.dataApi}nameusage?nidx=${key}`);
            await decorateWithDataset(relatedres)
            if (relatedres?.data) {
              setRelated(relatedres?.data);
             
              setLoading(false)
            }
            
          } catch (err) {
            setLoading(false)

            addError(err);
          }
         
    
        };
        init();
      }, [match]);

      const loadMore = async () => {
        setLoading(true)
      const {
        params: { key },
      } = match;
      
      try {
        const offset = related.offset+related.limit;
        const relatedres = await axios(`${config.dataApi}nameusage?nidx=${key}&offset=${offset}`);
        await decorateWithDataset(relatedres)
        if (relatedres?.data) {
          setRelated(
              {...relatedres?.data, result: [...related.result, ...relatedres?.data?.result ]}
                );
         
          setLoading(false)
        }
        
      } catch (err) {
        setLoading(false)

        addError(err);
      }
      }

      return <><Table
      size="small"
      columns={columns}
      dataSource={related?.result || []}
      loading={loading}
     /*  pagination={this.state.pagination}
      onChange={this.handleTableChange} */
      rowKey={(record) =>
        record?.id
          ? `${record?.datasetKey}_${record?.id}`
          : `${record?.name?.datasetKey}_${record?.name?.id}`
      }
      pagination={false}
      expandable={{
        expandedRowRender: (record) => 
          <pre>{JSON.stringify(record, null, 2)}</pre>
      }}
    />
   {!related?.last && <Row><Col flex="auto"></Col><Col><Button type="link" onClick={loadMore}>Load more</Button></Col></Row>}
    </>


}

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(RelatedNames));
