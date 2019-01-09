import React from 'react';
import Exception from './Exception';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';

const Exception404 = props => (
  <Exception
    type="404"
    desc={props.intl.formatMessage({ id: 'exception.description.404', defaultMessage: 'Sorry, the page you visited does not exist' })}
    linkElement={Link}
    backText={props.intl.formatMessage({ id: 'exception.back', defaultMessage: 'Back to dashboard' })}
  />
);

export default injectIntl(Exception404);
