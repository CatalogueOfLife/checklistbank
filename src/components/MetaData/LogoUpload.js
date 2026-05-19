import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";

import { PlusOutlined } from "@ant-design/icons";

import { Upload, Modal } from "antd";

const LogoUpload = ({ datasetKey }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);

  const getData = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/logo?size=large`)
      .then(() => {
        setFileList([
          {
            uid: "-1",
            name: "logo.png",
            status: "done",
            url: `${config.dataApi}dataset/${datasetKey}/logo?size=large`,
          },
        ]);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getData();
  }, [datasetKey]);

  const handleCancel = () => setPreviewVisible(false);

  const handlePreview = (file) => {
    setPreviewImage(file.url || file.thumbUrl);
    setPreviewVisible(true);
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onRemove = (e) => {
    console.log(e);
    axios
      .delete(`${config.dataApi}dataset/${datasetKey}/logo`)
      .then(() => {
        console.log("logo deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const customRequest = (options) => {
    const cfg = {
      headers: {
        "content-type": options.file.type,
      },
    };
    axios
      .post(options.action, options.file, cfg)
      .then((res) => {
        options.onSuccess(res.data, options.file);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload Logo</div>
    </div>
  );

  return (
    <div
      className="clearfix"
      style={fileList.length >= 1 ? { height: "220px" } : null}
    >
      <Upload
        action={`${config.dataApi}dataset/${datasetKey}/logo`}
        customRequest={customRequest}
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        onRemove={onRemove}
      >
        {fileList.length >= 1 ? null : uploadButton}
      </Upload>
      <Modal open={previewVisible} footer={null} onCancel={handleCancel}>
        <img alt="example" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default LogoUpload;
