import React from 'react';
import {Row, Col} from 'antd'


const KeyValueList = ({data}) => <div>
    {data.map(d => <Row ><Col span={6} style={{textAlign: 'right', paddingRight: '16px', fontWeight: 'bold'}}>{d.key}</Col><Col  span={18}>{d.value}</Col></Row>)}
</div>

export default KeyValueList;