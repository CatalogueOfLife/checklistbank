import React from 'react'
import _ from 'lodash'
import config from "../../config";
import axios from 'axios'
import {Tooltip, Tag, notification} from 'antd'


const deleteDecision = (id, deleteCallback) => {
  return axios.delete( `${config.dataApi}decision/${id}`)
    .then(res => {
      notification.open({
        message: "Decision deleted"
      });
      if (deleteCallback && typeof deleteCallback === 'function' ){
        deleteCallback()
      }
    })
}

const DecisionTag = ({decision, deleteCallback}) => {
    if(!_.get(decision, 'mode')) {
        return "";
      } else if(['block', 'chresonym'].includes(_.get(decision, 'mode'))){
        return  <Tooltip title={_.get(decision, 'mode')}> <Tag closable onClose={() => deleteDecision(_.get(decision, 'key'), deleteCallback)} className="decision-tag" >
        {_.get(decision, 'mode').substring(0, 2)}...
        </Tag></Tooltip>
      } else if(_.get(decision, 'status')) {
        return <Tooltip title={_.get(decision, 'status')}>
        <Tag closable onClose={() => deleteDecision(_.get(decision, 'key'), deleteCallback)} className="decision-tag"  >
        {_.get(decision, 'status') ? `${decision.status.substring(0, 2)}...` : ''}
        </Tag>
        </Tooltip>
      } else {
        return <Tooltip title="Update">
        <Tag closable onClose={() => deleteDecision(_.get(decision, 'key'), deleteCallback)} className="decision-tag"  >
        up...
        </Tag>
        </Tooltip>
      }
}

export default DecisionTag