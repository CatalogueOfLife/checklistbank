import React from 'react';
import {Row, Col} from 'antd'
import {Link} from "react-router-dom"

function isValidURL(string) {
    if (typeof string !== 'string') return false;
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    if (res == null)
      return false;
    else
      return true;
  };

const KeyValueList = ({data}) => <div>
    {data.map(d => <Row key={d.key}><Col span={6} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>{d.key}</Col><Col  span={18}>{isValidURL(d.value) ? <a href={d.value} target="_blank">{d.value}</a> : d.value }</Col></Row>)}
</div>

export default KeyValueList;