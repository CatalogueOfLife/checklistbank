import React, {useState, useEffect} from 'react'
import { Table, Alert, Row, Col, Form, Button, Tooltip, Tag, ConfigProvider, Empty } from "antd";
import { LockOutlined, UnlockOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config";
import moment from "moment";

import { NavLink } from "react-router-dom";
import withContext from "../../components/hoc/withContext";

const Releases = ({dataset, addError}) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [pagination, setPagination] = useState( {
        pageSize: 10,
        current: 1,
        position: ['bottomLeft']
      })
    useEffect(() => {
        
        if(dataset){
            getData()
        }
    }, [dataset])

    const getData = async (offset = 0, limit = 10, pager) => {
        try {
            setLoading(true)
            const res = await axios(`${config.dataApi}dataset?releasedFrom=${dataset?.key}&offset=${offset}&limit=${limit}&sortBy=created`)
            setData(res?.data?.result || [])
            setPagination({...pagination,...pager, total: res?.data?.total})
            setLoading(false)
        } catch (error) {
            setLoading(false)
            addError(error)
        }

    }
    const handleTableChange = (pager, filters, sorter) => {
        const {pageSize, current} = pager;
        const offset = (current - 1) * pageSize;
       // setPagination(pager)
        getData(offset, pageSize, pager)
    }
    const columns = [ {
        title: "Alias",
        dataIndex: "alias",
        key: "alias",
        render: (text, record) => {
          return (
            <NavLink
              to={{ pathname: `/dataset/${record.key}/about` }}
              exact={true}
            >
              {text}
            </NavLink>
          );
        },
        // sorter: true
      },
      
      {
        title: "Version",
        dataIndex: "version",
        key: "version",
      },
      {
        title: "Size",
        dataIndex: "size",
        key: "size",
        //sorter: true,
        render: (text) => {
          try {
            return Number(text).toLocaleString("en-GB");
          } catch (err) {
            console.log(err);
            return "";
          }
        },
      },
      {
        title: "Created",
        dataIndex: "created",
        key: "created",
       // sorter: true,
        render: (date) => {
          return moment(date).format("MMM Do YYYY");
        },
      },
      {
        title: "License",
        dataIndex: "license",
        key: "license",
      },

     
      {
        title: "",
        dataIndex: "private",
        key: "private",
        render: (text, record) => {
          return text === true ? (
            <LockOutlined style={{ color: "red" }} />
          ) : (
            <UnlockOutlined style={{ color: "green" }} />
          );
        },
      }]

    return <div style={{marginLeft: '46px',width: "800px" }}>
        <h1>Releases</h1>
        <Table
            className='releases'
              size="small"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              
            />
    </div>
}

const mapContextToProps = ({
    addError
  }) => ({ addError });
  
  export default withContext(mapContextToProps)(Releases);