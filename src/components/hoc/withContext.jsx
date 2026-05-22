import React from 'react';

import { AppContext } from './ContextProvider';

/**
 * Wrapper will just add some data from the AppContext to the wrapped component's props
 * You should give function as an input with a desired values/methods to be provided
 * Given function works like Redux connect mappers
 *
 * By default wrapper would provide nothing
 * @param injectedProps
 * @returns {function(*): function(*): *}
 */
const withContext = (injectedProps = context => {}) => WrappedComponent => {
  const Wrapper = props => {
    return (

      <AppContext.Consumer>
        {context => <WrappedComponent {...injectedProps(context)} {...props} />}
      </AppContext.Consumer>
    );
  };

  return Wrapper;
};

export default withContext;