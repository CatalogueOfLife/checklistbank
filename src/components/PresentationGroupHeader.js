import React from 'react';
import PropTypes from 'prop-types';

import Help from './Help';
import styles from './PresentationGroupHeader.module.css';

/**
 * Component responsible for data display in a read mode
 * @param title - Sub headline text
 * @param helpText - text to be displayed as a tip
 * @returns {*}
 * @constructor
 */
const PresentationGroupHeader = ({ title, helpText }) => {
  return (
    <h3 className={styles.header}>
      {title}
      <Help title={helpText} />
    </h3>
  );
};

PresentationGroupHeader.propTypes = {
  title: PropTypes.string.isRequired,
  helpText: PropTypes.object,
};

export default PresentationGroupHeader;