import React from 'react';
import Exception from './Exception';
import { Link } from 'react-router-dom';
import Layout from '../LayoutNew'
const Exception404 = props => (
 <Layout><Exception
    type="404"
    desc="Sorry, the page you visited does not exist"
    linkElement={Link}
    backText="Back to dashboard"
  />
  </Layout> 
);

export default Exception404;
