import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { NavLink } from "react-router-dom";
import withRouter from "../../withRouter";
import { Button, Row, Col, Tooltip, Table, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import axios from "axios";
import config from "../../config";
import Classification from "../NameSearch/Classification";
import { resizableComponents, useResizableColumns } from "./resizableColumns";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const limit = 500;

import _ from "lodash";

// Link to the actual usage in the source dataset: a taxon page for accepted
// usages (resolving to the accepted taxon for synonyms) and the name page for
// bare names without a usage.
const usageUri = (record) =>
  !_.get(record, "id") || record?.bareName || !_.get(record, "status")
    ? `/dataset/${_.get(record, "datasetKey")}/name/${encodeURIComponent(
        _.get(record, "name.id")
      )}`
    : `/dataset/${_.get(record, "datasetKey")}/taxon/${encodeURIComponent(
        _.get(record, "accepted.id")
          ? _.get(record, "accepted.id")
          : _.get(record, "id")
      )}`;

// Prefer "{alias}: {title}" — the alias is the most recognizable
// disambiguator between releases — falling back to the title alone. The title
// is rendered in a smaller font; the alias stays at the regular size.
const datasetTitleStyle = { fontSize: "0.85em" };
const datasetLabel = (dataset) =>
  dataset?.alias ? (
    <>
      {dataset.alias}: <span style={datasetTitleStyle}>{dataset.title}</span>
    </>
  ) : (
    <span style={datasetTitleStyle}>{dataset?.title}</span>
  );
const datasetLabelText = (dataset) =>
  dataset?.alias ? `${dataset.alias}: ${dataset.title}` : dataset?.title;

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



const RelatedNames = ({ match, addError, group, defaultFilteredValue }) => {
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
            const relatedres = await axios(`${config.dataApi}nameusage?nidx=${key}&limit=${limit}`);
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
        const relatedres = await axios(`${config.dataApi}nameusage?nidx=${key}&offset=${offset}&limit=${limit}`);
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
      const columns = [
        {
            title: "Dataset",
            dataIndex: ["dataset", "title"],
            key: "datasetLabel",
            width: 260,
            ellipsis: { showTitle: false },
            render: (text, record) => (
              <Tooltip title={datasetLabelText(record.dataset)}>
                <NavLink
                  key={_.get(record, "id")}
                  to={{
                    pathname: usageUri(record),
                  }}
                  end
                >
                  {datasetLabel(record.dataset)}
                </NavLink>
              </Tooltip>
            ),

          },
        {
          title: "Scientific Name",
          dataIndex: ["labelHtml"],
          key: "scientificName",
          width: 320,
          filters: group ? group.map(name => ({text: <span dangerouslySetInnerHTML={{ __html: name.labelHtml }} />, value: name.id})) : null,
          onFilter: (value, record) => record.name.namesIndexId === value,
          sorter: {
            compare: (a, b) => a.name.namesIndexId - b.name.namesIndexId,

          },
          render: (text) => <span dangerouslySetInnerHTML={{ __html: text }} />,
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

      const resizableCols = useResizableColumns(columns);

      return <>
    <Typography.Paragraph type="secondary">
      All name usages across every ChecklistBank dataset that share this name, linked via the names index.
    </Typography.Paragraph>
    <Table
      size="small"
      components={resizableComponents}
      columns={resizableCols}
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
          // `dataset` is augmented client-side for the Dataset column; the
          // verbatimKey and audit fields are noise here. Omit them so the
          // expanded JSON shows only the meaningful record content.
          <pre>{JSON.stringify(_.omit(record, ["dataset", "verbatimKey", "created", "createdBy", "modified", "modifiedBy"]), null, 2)}</pre>
      }}
    />
   {!related?.last && <Row><Col flex="auto"></Col><Col><Button type="link" onClick={loadMore}>Load more</Button></Col></Row>}
    </>


}

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(RelatedNames));
