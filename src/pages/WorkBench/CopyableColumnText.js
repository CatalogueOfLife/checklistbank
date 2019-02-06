import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { message, Tooltip } from 'antd';

const CopyableColumnText = ({text, width}) => (
    <CopyToClipboard text={text}
    onCopy={() =>   message.info(`Copied "${text}" to clipboard`)}>
    <Tooltip title={text}>
    <div style={{width: width || '80px'}} className="truncate">{text}</div>
    </Tooltip>
  </CopyToClipboard>
)

export default CopyableColumnText