import React from 'react';
import _ from 'lodash';

class ErrorMsg extends React.Component {

    render() {

        const { error } = this.props;
        return (
            <div>
                {error.message && <p>
                    {error.message}
                </p>}
                {_.get(error, 'response.data.message') && <p>
                    {_.get(error, 'response.data.message')}
                </p>}
                {_.get(error, 'response.request.responseURL') &&
                    <a href={_.get(error, 'response.request.responseURL')} target="_blank">{_.get(error, 'response.request.responseURL')}</a>}
            </div>

        );
    }
}



export default ErrorMsg;
