import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import styles from './Help.module.css';

const Help = ({ title }) => {
  return (
    <React.Fragment>
      {title && <span className={styles.tip}>
        <Tooltip title={title}>
          <QuestionCircleOutlined className={styles.icon} />
        </Tooltip>
      </span>}
    </React.Fragment>
  );
};

export default Help;