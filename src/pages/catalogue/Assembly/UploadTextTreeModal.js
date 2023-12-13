import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";

import {
  Input,
  Modal,
  Button,
  Select,
  Alert,
  notification,
  Typography,
  Row,
  Col,
} from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import EditableTable from "./EditableTable";
import ReferenceAutocomplete from "./ReferenceAutocomplete";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import TextTreeUpload from "../../../components/TextTreeUpload";

const TextTreeUploadModal = ({ taxon, onCancel }) => {
  const [visible, setVisible] = useState(true);
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {}, [taxon]);

  return (
    <Modal
      style={{ top: 150, marginRight: 20 }}
      title={
        <span>
          Upload text tree to{" "}
          <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
        </span>
      }
      visible={visible}
      onOk={() => {
        setVisible(false);
        onCancel();
      }}
      onCancel={() => {
        setVisible(false);
        onCancel();
      }}
      destroyOnClose={true}
      footer={null}
    >
      <Row>
        <Col>
          <Typography.Text>
            Uploading a text tree to a taxon, will by default add the taxa in
            the text tree as new children. Checking the replace option will,
            depends on tree content:
            <ol>
              <li>
                If the text tree has a single root and the canonical name is the
                same (i.e. authorships can change), the root and all its
                children will be replaced.
              </li>
              <li>Otherwise only the children are replaced.</li>
            </ol>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <TextTreeUpload taxon={taxon} />
      </Row>
    </Modal>
  );
};

export default TextTreeUploadModal;
