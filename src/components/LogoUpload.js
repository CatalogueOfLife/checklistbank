import React from "react";
import axios from "axios";
import config from "../config";

import { Upload, Icon, Modal } from "antd";

class LogoUpload extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.customRequest = this.customRequest.bind(this)
    this.state = {
      previewVisible: false,
      previewImage: "",
      fileList: []
    };
  }
componentWillMount(){
    this.getData()
}
  getData = () => {
    this.setState({ loading: true });
    const { datasetKey } = this.props;
    axios(`${config.dataApi}dataset/${datasetKey}/logo?size=large`)
      .then(res => {
        this.setState({
          loading: false,
          fileList: [
            {
              uid: "-1",
              name: "logo.png",
              status: "done",
              url: `${config.dataApi}dataset/${datasetKey}/logo?size=large`
            }
          ]
        });
      })
      .catch(err => {
        // this.setState({ loading: false, error: err, data: [] });
        console.log(err);
      });
  };
  handleCancel = () => this.setState({ previewVisible: false });

  handlePreview = file => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true
    });
  };

  handleChange = ({fileList}) => {
    this.setState({ fileList })
  };
  onRemove = (e) =>{
    console.log(e)
    const {datasetKey} = this.props;

    axios.delete(`${config.dataApi}dataset/${datasetKey}/logo`)
      .then(()=>{
          console.log('logo deleted')
      })
      .catch((err) => {
      console.log(err)
    })
  }
  customRequest= (options) => {
    
    const config= {
      "headers": {
        "content-type": options.file.type
      }
    }
    axios.post(options.action, options.file, config).then((res) => {
      options.onSuccess(res.data, options.file)
    }).catch((err) => {
      console.log(err)
    })
    
  }

  render() {
    const { previewVisible, previewImage, fileList } = this.state;
    const {datasetKey} = this.props;
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload Logo</div>
      </div>
    );
    return (
      <div className="clearfix">
        <Upload
          action={`${config.dataApi}dataset/${datasetKey}/logo`}
          customRequest={this.customRequest}
          listType="picture-card"
          className="logo-uploader"
          fileList={fileList}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
          onRemove={this.onRemove}
        >
          {fileList.length >= 1 ? null : uploadButton}
        </Upload>
        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img alt="example" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </div>
    );
  }
}

export default LogoUpload;
