import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import moment from "moment";
import _ from "lodash";
import {
  Button,
  Modal,
  Select,
  message,
  Alert,
  Radio,
  Row,
  Col,
  Divider,
  Checkbox,
} from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import PageContent from "../../components/PageContent";

class DatasetDownload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  render() {
    const { error } = this.state;
    return (
      <PageContent>
        {error && <Alert description={<ErrorMsg error={error} />} type="error" />}
        Download Key here
      </PageContent>
    );
  }
}

export default DatasetDownload;
