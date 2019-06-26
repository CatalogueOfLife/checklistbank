import React from "react";
import { Icon, Popover } from "antd";
import axios from "axios";
import config from "../../config";


class ReferencePopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reference: null,
      error: null
    };
  }
  componentWillMount = () => {
      this.getData()
  }
  getData = () => {
      const {referenceId, datasetKey} = this.props;

      axios(`${config.dataApi}dataset/${datasetKey}/reference/${referenceId}`)
      .then(res => this.setState({reference: res.data}))
  }

  render = () => {
    const { error, reference } = this.state;
   
    
    return reference ? 
          <Popover
            placement="left"
            title="Reference"
            content={reference.citation}
            trigger="click"
          >
            <Icon
              type="book"
              style={{ cursor: "pointer" }}
            />
          </Popover>
        
    : "";
  };
}

export default ReferencePopover;
