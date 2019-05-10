import React from 'react';
import injectSheet from 'react-jss';
import { Row, Col } from 'antd';
import { FormattedMessage } from 'react-intl';


// Wrappers
import withWidth, { MEDIUM } from '../../components/hoc/Width';

const styles = () => ({
  formItem: {
    paddingBottom: 0,
    width: '100%',
    clear: 'both',
    borderBottom: '1px solid #eee',
    '&:last-of-type': {
      border: 'none'
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
    marginBottom: 5,
    marginTop: 5
  },
  mediumMargin: {
    marginBottom: 10,
    marginTop: 10
  }
});

/**
 * Component responsible for data display in a read mode
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param classes - passed from injectSheet wrapper, CSS styles from styles object above
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const BorderedListItem = ({ classes, children,  size }) => {
  const getValue = () => {
    let value = (
      <span className={classes.noContent}>
        <FormattedMessage id="noInformation" defaultMessage="No information"/>
      </span>
    );

    if (Array.isArray(children) && children.length > 0) {
      value = children.map((item, i) => (<span className={classes.content} key={i}>{item}</span>));
    } else if (!Array.isArray(children) && typeof children !== 'undefined') {
      value = <span className={classes.content}>{children}</span>;
    }

    return value;
  };


  const marginSize = size === 'medium' ? classes.mediumMargin : classes.smallMargin;
  return (
    <Row className={classes.formItem}>
  
      <Col span={24} className={marginSize}>
        {getValue()}
      </Col>
    </Row>
  );
};



export default withWidth()(injectSheet(styles)(BorderedListItem));
