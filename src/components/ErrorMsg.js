import React from 'react';
import _ from 'lodash';

class ErrorMsg extends React.Component {

    render() {

        const { error } = this.props;
        return (
            <div>
                {error.message && <h3>
                    {error.message}
                </h3>}
                {_.get(error, 'response.data.message') && <p>
                    {_.get(error, 'response.data.message')}
                </p>}
                {_.get(error, 'response.data.details') && <p>
                    {_.get(error, 'response.data.details')}
                </p>}
                {_.get(error, 'config.method') && <p>
                    HTTP method: <strong>{_.get(error, 'config.method').toUpperCase()}</strong>
                </p>}
                {_.get(error, 'response.request.responseURL') &&
                    <p><a href={_.get(error, 'response.request.responseURL')} target="_blank">{_.get(error, 'response.request.responseURL')}</a></p>}
                 {_.get(error, 'config.data') && typeof _.get(error, 'config.data') === 'string' && <div>
                     <h4>Body:</h4>
                     <p>
                     {_.get(error, 'config.data')}
                </p></div>}
            </div>

        );
    }
}



export default ErrorMsg;
