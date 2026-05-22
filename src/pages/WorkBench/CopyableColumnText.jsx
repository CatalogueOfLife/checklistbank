import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { App, Tooltip } from 'antd';

const CopyableColumnText = ({text, width}) => {
  const { message } = App.useApp();
  return (
    <CopyToClipboard text={text}
    onCopy={() => message.info(`Copied "${text}" to clipboard`)}>
    <Tooltip title={text}>
    <div style={{width: width || '80px'}} className="truncate">{text}</div>
    </Tooltip>
  </CopyToClipboard>
  );
};

export default CopyableColumnText