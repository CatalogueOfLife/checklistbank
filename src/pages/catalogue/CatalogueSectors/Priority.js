import React, {useState, useEffect} from "react";

import { Table } from 'antd';
import ReactDragListView from "react-drag-listview";
import config from "../../../config";
import qs from "query-string";
import axios from "axios";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { withRouter } from "react-router-dom";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

import _ from "lodash"
const PAGE_SIZE = 250;
const  data_ = [
    {
        key: "1",
        name: "Boran",
        gender: "male",
        age: "12",
        address: "New York"
    },
    {
        key: "2",
        name: "JayChou",
        gender: "male",
        age: "38",
        address: "TaiWan"
    },
    {
        key: "3",
        name: "Lee",
        gender: "female",
        age: "22",
        address: "BeiJing"
    },
    {
        key: "4",
        name: "ChouTan",
        gender: "male",
        age: "31",
        address: "HangZhou"
    },
    {
        key: "5",
        name: "AiTing",
        gender: "female",
        age: "22",
        address: "Xi’An"
    }
]

const columns = [
    {
        title: "Key",
        dataIndex: "key"
    },
    {
        title: "Name",
        dataIndex: "name"
    },
    {
        title: "Gender",
        dataIndex: "gender"
    },
    {
        title: "Age",
        dataIndex: "age"
    },
    {
        title: "Address",
        dataIndex: "address"
    },
    {
        title: "Operates",
        key: "operate",
        render: (text, record, index) =>
            <a className="drag-handle" href="#">Drag</a>
    }
]

const SectorPriority = ({catalogueKey, location, addError}) => {
    const [data, setData] = useState(data_)
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        pageSize: PAGE_SIZE,
        current: 1,
        showQuickJumper: true,
      })
    useEffect(() => {
        getData()
    },[])

    const dragProps = {
        onDragEnd(fromIndex, toIndex) {
            const newData = [...data];
            const item = newData.splice(fromIndex, 1)[0];
            newData.splice(toIndex, 0, item);
            setData(newData)
            
        },
        handleSelector: "a",
    };


    const  getData = () => {
       setLoading(true)
        const params = {
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
              selectedKeys={["catalogueSectors"]}
              openKeys={["assembly"]}
              title="Project sectors"
            >
              <PageContent>
            <h2>Table row with dragging</h2>
            <ReactDragListView {...dragProps}>
                <Table
                    size="small"
                    columns={columns}
                    pagination={false}
                    dataSource={data}
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
// export default SectorPriority;