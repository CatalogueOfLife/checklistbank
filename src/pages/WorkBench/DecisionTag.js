import React from 'react'
import _ from 'lodash'
import {Tooltip, Tag} from 'antd'

const DecisionTag = ({record, onClose}) => {
    if(!_.get(record, 'decisions[0].mode')) {
        return "";
      } else if(['block', 'chresonym'].includes(_.get(record, 'decisions[0].mode'))){
        return  <Tooltip title={_.get(record, 'decisions[0].mode')}> <Tag closable onClose={onClose}  >
        {_.get(record, 'decisions[0].mode').substring(0, 2)}...
        </Tag></Tooltip>
      } else {
        return <Tooltip title={_.get(record, 'decisions[0].status')}>
        <Tag closable onClose={onClose}  >
        {_.get(record, 'decisions[0].status').substring(0, 2)}...</Tag>
        </Tooltip>
      }
}

export default DecisionTag