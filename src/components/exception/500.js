import React from 'react';
import Exception from './Exception';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';

const Exception500 = props => (
  <Exception
    type="500"
    desc={props.intl.formatMessage({ id: 'exception.description.500', defaultMessage: 'Sorry, the server is reporting an error' })}
    linkElement={Link}
    backText={props.intl.formatMessage({ id: 'exception.back', defaultMessage: 'Back to dashboard' })}
  />
);

export default injectIntl(Exception500);
