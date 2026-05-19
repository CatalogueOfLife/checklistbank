import { useState, useEffect } from "react";
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { Input, Row, Col } from "antd";

const { TextArea } = Input;

const SectorNote = ({ note: noteProp, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (noteProp) {
      setNote(noteProp);
    }
  }, []);

  const toggleEdit = () => {
    setEdit((prev) => !prev);
  };

  return !edit ? (
    <>
      <Row>
        <Col span={12}>Note</Col>
        <Col span={11} style={{ textAlign: "right" }}>
          {note ? 'Edit' : 'Write'}
        </Col>
        <Col span={1} style={{ paddingLeft: "3px" }}><EditOutlined onClick={toggleEdit} /></Col>
        {note && <Col span={24}>{note}</Col>}
      </Row>
    </>
  ) : (
    <>
      <Row>
        <Col span={12}>Note</Col>
        <Col span={11} style={{ textAlign: "right" }}>
          Save
        </Col>
        <Col span={1} style={{ paddingLeft: "3px" }}>
          <SaveOutlined
            onClick={() => {
              toggleEdit();
              onSave(note);
            }} />
        </Col>
      </Row>
      <div style={{ borderBottom: "1px solid #ebedf0" }} />
      <TextArea value={note} onChange={evt => setNote(evt.currentTarget.value)}></TextArea>
    </>
  );
};

export default SectorNote;
