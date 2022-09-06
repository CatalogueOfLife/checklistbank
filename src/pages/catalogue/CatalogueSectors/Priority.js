import React, {useState, useEffect} from "react";
import { Table } from 'antd';
import ReactDragListView from "react-drag-listview";
import config from "../../../config";
import qs from "query-string";
import axios from "axios";
import Auth from "../../../components/Auth";

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
        current: 1,
        showQuickJumper: true,
      })
    useEffect(() => {
        getData()
    },[])
    const columns =  [{
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        width: 75}, ...getColumns(catalogueKey).filter(c => c?.title !== "Mode")];

    const updatePriority = async (sector, priority) => {
        await axios.put(
            `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, priority}
          )
    }
    const dragProps = {
       async onDragEnd(fromIndex, toIndex) {
            let priority = 0;
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


    const  getData = () => {
       setLoading(true)
        const params = {
          mode: "merge",
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
                ...pagination,
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
              selectedKeys={["catalogueSectorPriority"]}
              openKeys={["assembly"]}
              title="Project sector priority"
            >
            <PageContent>
            {Auth.canEditDataset({key: catalogueKey}, user) && <h2>Change sector priority by dragging rows in this table</h2> }
            {!Auth.canEditDataset({key: catalogueKey}, user) && <h2>Prioritazation of merge sectors</h2> }
            <ReactDragListView {...dragProps}>
                <Table
                    size="small"
                    columns={columns}
                    pagination={pagination}
                    dataSource={data}
                    loading={loading}
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
