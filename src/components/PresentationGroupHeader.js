import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';

import Help from './Help';

const styles = {
  header: {
    margin: 0,
    padding: 10,
    background: '#f7f7f7',
    border: '1px solid #eee',
    borderWidth: '1px 0'
  }
};

/**
 * Component responsible for data display in a read mode
 * @param title - Sub headline text
 * @param helpText - text to be displayed as a tip
 * @returns {*}
 * @constructor
 */
const PresentationGroupHeader = ({ title, helpText, classes }) => {
  return (
    <h3 className={classes.header}>
      {title}
      <Help title={helpText} />
    </h3>
  );
};

PresentationGroupHeader.propTypes = {
  title: PropTypes.object.isRequired,
  helpText: PropTypes.object,
};

export default injectSheet(styles)(PresentationGroupHeader);