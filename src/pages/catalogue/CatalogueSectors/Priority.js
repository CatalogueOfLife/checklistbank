import React, {useState, useEffect} from "react";
import { Table, notification, Button } from 'antd';
import SectorTabs from "./SectorTabs";
import {EditableCell, EditableRow} from "./EditableTableComponents";
import ReactDragListView from "react-drag-listview";
import config from "../../../config";
import qs from "query-string";
import axios from "axios";
import history from "../../../history";
import Auth from "../../../components/Auth";
import SyncButton from "../SectorSync/SyncButton";
import {DeleteOutlined} from "@ant-design/icons"
import getColumns from "./columns"
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { withRouter } from "react-router-dom";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

import _ from "lodash"
const PAGE_SIZE = 500;


const SectorPriority = ({catalogueKey, location, addError, user}) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        pageSize: PAGE_SIZE,
        current: 1
      })
    useEffect(() => {
        
            const params = qs.parse(_.get(location, "search"));
            setPagination({
                pageSize: params.limit || PAGE_SIZE,
                current: Number(params.offset || 0) / Number(params.limit || PAGE_SIZE) + 1,
              })     
        getData()
    },[catalogueKey, location.search])
    
    const onDeleteSector = (sector) => {
        
        axios
          .delete(`${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`)
          .then(() => {
            notification.open({
              message: "Deletion triggered",
              description: `Delete job for ${sector.id} placed on the sync queue`,
            });
            setData(data.filter((d) => d.id !== sector.id))
           
          })
          .catch((err) => {
              addError(err)
          });
      };

     const handleTableChange = (pagination_) => {
        const pager = { ...pagination , ...pagination_};
    
        const params = {
          ...qs.parse(_.get(location, "search")),
          limit: pager.pageSize,
          offset: (pager.current - 1) * pager.pageSize,
        };
    
        history.push({
          pathname: _.get(location, "pathname"),
          search: qs.stringify(params),
        });
      }; 
    const columns =  [{
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        editable: true,
        render: (text, record) => !isNaN(text) ? text : 'Not set',
        width: 75}, ...getColumns(catalogueKey).filter(c => c?.title !== "Mode")];

        if (Auth.canEditDataset({key: catalogueKey}, user)) {
            columns.push({
              title: "Action",
              key: "action",
              render: (text, record) => (
                <React.Fragment>
                  {!_.get(record, "target.broken")
                    && (
                      <SyncButton
                        size="small"
                        style={{ display: "inline", marginRight: "8px" }}
                        record={{ sector: record }}
                      />
                    )}
              <Button
                size="small"
                style={{ display: "inline" }}
                type="danger"
                onClick={() => onDeleteSector(record)}
              >
                <DeleteOutlined />
              </Button>
            
                    </React.Fragment>)
            })
        }
    const updatePriority = async (sector, priority) => {
        await axios.put(
            `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, priority}
          )
    }
    const dragProps = {
       async onDragEnd(fromIndex, toIndex) {
            let priority = !isNaN(data[0]?.priority) ? data[0]?.priority : 0;
            if(toIndex > 0){
                for(let i = toIndex; i >= 0; i--){
                    if(!isNaN(data[i]?.priority)){
                        priority = toIndex === data.length -1 ? Number(data[i]?.priority) +1 : Number(data[i]?.priority);
                        break;
                    }
                }
            }
            
            const sector =  data[fromIndex]
            try {
                await updatePriority(sector, priority)
                sector.priority = priority;
                getData()
             
            } catch (error) {
                addError(error)
                getData()
            } 
            
        },
        handleSelector: "tr",
    };

    const handleSave = async (row) => {
        try {
            await updatePriority(row, Number(row.priority))
            getData()
         
        } catch (error) {
            addError(error)
            getData()
        }
      };

    const  getData = () => {
       setLoading(true)
        const params = {
          mode: "merge",
          limit: PAGE_SIZE,
          ...qs.parse(_.get(location, "search", {})),
          datasetKey: catalogueKey,
        };
        axios(
          `${config.dataApi}dataset/${catalogueKey}/sector?${qs.stringify(params)}`
        )
          .then(decorateWithDataset)
          .then((res) => {
              setLoading(false);
              setData( _.get(res, "data.result") || []);
              setPagination({
                pageSize: Number(_.get(res, "data.limit") || PAGE_SIZE) ,
                current: Number(_.get(res, "data.offset") || 0) / Number(_.get(res, "data.limit") || PAGE_SIZE) + 1,
                total: _.get(res, "data.total"),
              })
          }

          )
          .catch((err) => {
            addError(err)
            setLoading(false)
            setData([])
          });
      };
    
    const  decorateWithDataset = (res) => {
        if (!res.data.result) return res;
        return Promise.all(
          res.data.result.map((sector) =>
            datasetLoader
              .load(sector.subjectDatasetKey)
              .then((dataset) => (sector.dataset = dataset))
          )
        ).then(() => res);
      };

 
        return (
            <Layout
              selectedKeys={["catalogueSectors"]}
              openKeys={["assembly"]}
              title="Project sector priority"
            >
            <PageContent>
            <SectorTabs />
            {Auth.canEditDataset({key: catalogueKey}, user) && <h2>Change sector priority by dragging rows in this table</h2> }
            {!Auth.canEditDataset({key: catalogueKey}, user) && <h2>Prioritazation of merge sectors</h2> }
            <ReactDragListView {...dragProps}>
                <Table
                    size="small"
                    onChange={handleTableChange}
                    columns={columns.map((col) => {
                        if (!col.editable) {
                          return col;
                        }
                    
                        return {
                          ...col,
                          onCell: (record) => ({
                            record,
                            editable: col.editable,
                            dataIndex: col.dataIndex,
                            title: col.title,
                            handleSave,
                          }),
                        };
                      })}
                    pagination={pagination}
                    dataSource={data}
                    loading={loading}
                    components={{
                        body: {
                          row: EditableRow,
                          cell: EditableCell,
                        },
                      }}
                    rowClassName={() => 'editable-row'}
                />
            </ReactDragListView>
            </PageContent>
            </Layout>
    );
}


const mapContextToProps = ({ user, rank, catalogueKey, addError }) => ({
    addError,
    user,
    rank,
    catalogueKey,
  });
  
export default withContext(mapContextToProps)(withRouter(SectorPriority));
