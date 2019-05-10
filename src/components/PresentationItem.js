import React from 'react';
import injectSheet from 'react-jss';
import { Row, Col } from 'antd';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import Help from './Help';

// Wrappers
import withWidth, { MEDIUM } from './hoc/Width';

const styles = () => ({
  formItem: {
    paddingBottom: 0,
    width: '100%',
    clear: 'both',
    borderBottom: '1px solid #eee',
    '&:last-of-type': {
      border: 'none'
    },
    '&>div': {
      paddingLeft: 10,
      paddingRight: 10
    }
  },
  label: {
    display: 'block',
    color: 'rgba(0, 0, 0, 0.85)'
  },
  content: {
    wordBreak: 'break-word',
    marginBottom: 0
  },
  noContent: {
    wordBreak: 'break-word',
    color: '#bbb',
    marginBottom: 0
  },
  contentCol: {
    wordBreak: 'break-word'
  },
  smallMargin: {
    marginBottom: 3,
    marginTop: 3
  },
  mediumMargin: {
    marginBottom: 10,
    marginTop: 10
  }
});

/**
 * Component responsible for data display in a read mode
 * @param label - label text
 * @param helpText - text to be displayed as a tip
 * @param md - Label column width on medium devices - seconds column is the reamining.
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param classes - passed from injectSheet wrapper, CSS styles from styles object above
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const PresentationItem = ({ label, helpText, classes, children, width, md, size }) => {
  const getValue = () => {
    let value = (
      <dd className={classes.noContent}>
        <FormattedMessage id="noInformation" defaultMessage="No information"/>
      </dd>
    );

    if (Array.isArray(children) && children.length > 0) {
      value =  children.map((item, i) => (<dd className={classes.content} key={i}>{item}</dd>));
    } else if (!Array.isArray(children) && typeof children !== 'undefined') {
      value = <dd className={classes.content}>{children}</dd>;
    }

    return value;
  };

  const medium = md || 8;
  const mediumCol2 = medium < 24 ? 24 - medium : 24;
  const marginSize = size === 'medium' ? classes.mediumMargin : classes.smallMargin;
  return (
    <Row className={classes.formItem}>
      <Col sm={24} md={medium} style={width < MEDIUM ? { marginBottom: 0 } : {}} className={marginSize}>
        <div>
          <dt className={classes.label}>
            {label}
            <Help title={helpText}/>
          </dt>
        </div>
      </Col>
      <Col sm={24} md={mediumCol2} style={width < MEDIUM ? { marginTop: 0 } : {}} className={marginSize}>
        {getValue()}
      </Col>
    </Row>
  );
};

PresentationItem.propTypes = {
  label: PropTypes.string.isRequired,
  helpText: PropTypes.object
};

export default withWidth()(injectSheet(styles)(PresentationItem));
