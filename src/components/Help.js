import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';

const styles = {
  tip: {
    color: 'rgba(0,0,0,.45)',
    marginLeft: '4px',
  },
  icon: {
    marginTop: '4px'
  }
};

const Help = ({ title, classes }) => {
  return (
    <React.Fragment>
      {title && <span className={classes.tip}>
        <Tooltip title={title}>
          <QuestionCircleOutlined className={classes.icon} />
        </Tooltip>
      </span>}
    </React.Fragment>
  );
};

Help.propTypes = {
  title: PropTypes.object
};

export default injectSheet(styles)(Help);