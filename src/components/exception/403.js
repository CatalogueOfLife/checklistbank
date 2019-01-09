import React from 'react';
import Exception from './Exception';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';

const Exception403 = props => (
  <Exception
    type="403"
    desc={props.intl.formatMessage({ id: 'exception.description.403', defaultMessage: 'Sorry, you don\'t have access to this page' })}
    linkElement={Link}
    backText={props.intl.formatMessage({ id: 'exception.back', defaultMessage: 'Back to dashboard' })}
  />
);

export default injectIntl(Exception403);
