

import React, {useState, useEffect} from "react";

import withContext from "../../../components/hoc/withContext";
import { Spin } from "antd";

import axios from "axios";
import config from "../../../config";

import PresentationItem from "../../../components/PresentationItem";

const ExpandedRow = ({uuid, addError}) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    useEffect(() => {
        
        const init = async () => {
            try {
                setLoading(true)
                const res = await axios(`${config.dataApi}admin/job/${uuid}`)
                setData(res?.data)
                setLoading(false)

            } catch (error) {
                addError(error)
                setLoading(false)

            }
        }
        init()
    },[])
    return <>
       {loading && <Spin></Spin>}
       {data && Object.keys(data).map((key) => <PresentationItem label={key} >
                {data[key]}
       </PresentationItem>)}
    </>
    
}

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(ExpandedRow);