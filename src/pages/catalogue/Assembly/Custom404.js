import React from 'react';
import _ from 'lodash';
import ImportButton from '../../Imports/importTabs/ImportButton';
import {Button} from 'antd'
import AddChildModal from './AddChildModal';

class Custom404 extends React.Component {


    state = {
        modalVisible: false
    }


    render() {

        const { error, treeType, dataset, loadRoot } = this.props;
        const {modalVisible} = this.state;
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

                {treeType === 'gsd' && <ImportButton record={{datasetKey: dataset.key}}></ImportButton>}
                {treeType === 'mc' && <Button type='primary' onClick={() => this.setState({modalVisible: !modalVisible})}>Add root taxon</Button>}
                {modalVisible && <AddChildModal parent={{datasetKey: dataset.key}} onCancel={() => this.setState({ modalVisible: false })} onSuccess={() => this.setState({ modalVisible: false }, loadRoot)}></AddChildModal>}
                
            </div>

        );
    }
}



export default Custom404;
