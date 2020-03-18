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
/* const { Option } = Select;
const FormItem = Form.Item;


const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };
 */
class CatalogueSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      catalogues: [],
      visible: false
    };
  }

  componentDidMount = () => {
    this.getCatalogues();
  };

  getCatalogues = () => {
    axios(`${config.dataApi}dataset?origin=managed&limit=1000`).then((res)=> this.setState({catalogues: _.get(res, 'data.result') ?_.get(res, 'data.result') : [] }))
  }
  hide = () => {
    this.setState({
      visible: false,
    });
  };

  handleVisibleChange = visible => {
    this.setState({ visible });
  };
  
  onCatalogueChange = newCatalogueKey => {
    const { setCatalogue} = this.props;  
    const {
        match: {
          params: { catalogueKey }
        }
      } = this.props;
    const {catalogues} = this.state;
    const selectedCatalogue = catalogues.find(c => c.key === newCatalogueKey)
    //setCatalogue(selectedCatalogue)
      const newPath = _.get(this.props, "location.pathname").replace(`catalogue/${catalogueKey}/`, `catalogue/${newCatalogueKey}/`);
    history.push({
        pathname: newPath
      });
    this.setState({visible:false})
  };
  render = () => {
    const {
        match: {
          params: { catalogueKey }
        }
      } = this.props;
      const {catalogues} = this.state;
    return  <React.Fragment>
    <a onClick={e => {e.stopPropagation(); this.setState({visible: true})}} ><Icon type="setting" /></a>
    <Modal
          title="Select catalogue"
          visible={this.state.visible}
          maskClosable={true}
          onCancel={this.hide}
          footer={null}
        >
            <div onClick={e => {
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
            }}>
           {catalogues.length > 0 && <Select
                showSearch
                style={{ width: "100%" }}
                value={catalogueKey || null}
                placeholder="Select catalogue"
                optionFilterProp="children"
                onChange={this.onCatalogueChange}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                
              >
                {catalogues.map(c => (
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
const mapContextToProps = ({ catalogueKey, catalogue, setCatalogue, user }) => ({
    catalogueKey,
    catalogue,
    setCatalogue,
    user
  });
  export default withContext(mapContextToProps)(withRouter(CatalogueSelect));