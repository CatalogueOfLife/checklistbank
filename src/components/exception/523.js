import React from 'react';
import Exception from './Exception';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';

const Exception523 = props => (
  <Exception
    type="523"
    desc={props.intl.formatMessage({ id: 'exception.description.523', defaultMessage: 'Sorry, the server is unreachable. Perhaps, you are offline.' })}
    linkElement={Link}
  />
);

export default injectIntl(Exception523);
