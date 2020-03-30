import React from "react";
import withContext from "../../components/hoc/withContext";
import {withRouter} from "react-router-dom"
import config from "../../config";
import _ from "lodash";
import {
    Modal,
  Select,
  Icon
} from "antd";
import history from "../../history"
// import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";

import axios from "axios";
import ErrorMsg from "../../components/ErrorMsg";
const {Option} = Select;

class SourceSeelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sources: [],
      visible: false
    };
  }

  componentDidMount = () => {
    this.getSources();
  };

  componentDidUpdate = (prevProps) => {
      if(_.get(prevProps, 'catalogueKey') !== _.get(this.props, 'catalogueKey')){
          this.getSources()
      }
  }
  getSources = () => {
    const {
      catalogueKey
      } = this.props;
    axios(`${config.dataApi}dataset?contributesTo=${catalogueKey}&limit=1000`).then((res)=> this.setState({sources: _.get(res, 'data.result') ?_.get(res, 'data.result').filter(d => !!d.imported) : [] }))
  }
  hide = () => {
    this.setState({
      visible: false,
    });
  };

  handleVisibleChange = visible => {
    this.setState({ visible });
  };
  
  onSourceChange = newDatasetKey => {
    const { setDataset} = this.props;  
    const {
        match: {
          params: { key }
        }, catalogueKey
      } = this.props;
    const {sources} = this.state;
    const selectedSource = sources.find(c => c.key === newDatasetKey)
    if(catalogueKey && selectedSource && _.get(this.props, "location.pathname").indexOf(`catalogue/${catalogueKey}/dataset/`) > -1){
        const newPath = _.get(this.props, "location.pathname").replace(`catalogue/${catalogueKey}/dataset/${key}/`, `catalogue/${catalogueKey}/dataset/${newDatasetKey}/`);
    history.push({
        pathname: newPath
      });
    } else if(catalogueKey) {

        setDataset(selectedSource)
        history.push({
          pathname: `/catalogue/${catalogueKey}/dataset/${newDatasetKey}/issues`
        });
    }
      
    this.setState({visible:false})
  };
  render = () => {
    const {
        match: {
          params: { key }
        }
      } = this.props;
      const {sources} = this.state;
    return  <React.Fragment>
    <a onClick={e => {e.stopPropagation(); this.setState({visible: true})}} ><Icon type="setting" /></a>
    <Modal
          title="Select source"
          visible={this.state.visible}
          maskClosable={true}
          onCancel={this.hide}
          footer={null}
        >
            <div onClick={e => {
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
            }}>
           {sources.length > 0 && <Select
                showSearch
                style={{ width: "100%" }}
                value={key || null}
                placeholder="Select source"
                optionFilterProp="children"
                onChange={this.onSourceChange}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                
              >
                {sources.map(c => (
                  <Option
                    onClick={(e)=> {
                        e.domEvent.stopPropagation();
    e.domEvent.nativeEvent.stopImmediatePropagation();
                    }}
                    value={c.key}
                    key={c.key}
                  >{`${c.alias ? c.alias+' ' : ''}[${c.key}]`}</Option>
                ))}
              </Select>
              }
                  </div> 
                
        </Modal>
    
    </React.Fragment>
  }
}
const mapContextToProps = ({ catalogueKey, catalogue, setDataset, user }) => ({
    catalogueKey,
    catalogue,
    setDataset,
    user
  });
  export default withContext(mapContextToProps)(withRouter(SourceSeelect));