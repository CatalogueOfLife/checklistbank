import React from "react";
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { Input, Row, Col } from "antd";

const { TextArea } = Input;

class SectorNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      note: null
    };
  }

  componentDidMount = () => {
      if(this.props.note){
          this.setState({note: this.props.note})
      }
  }
  toggleEdit = () => {
    const { edit } = this.state;
    this.setState({ edit: !edit });
  };
  render = () => {
    const {  onSave } = this.props;
    const { edit, note } = this.state;

    return !edit ? (
        <React.Fragment>
      <Row>
          <Col span={12}>Note</Col>
          <Col span={11} style={{ textAlign: "right" }}>
          { note ? 'Edit' : 'Write'}
          </Col>
          <Col span={1} style={{ paddingLeft: "3px" }}><EditOutlined onClick={this.toggleEdit} /></Col>
          {note && <Col span={24}>{note}</Col>}
        </Row>
        
       
      </React.Fragment>
    ) : (
      <React.Fragment>
          <Row>
          <Col span={12}>Note</Col>
          <Col span={11} style={{ textAlign: "right" }}>
          Save 
          </Col>
          <Col span={1} style={{ paddingLeft: "3px" }}>
          <SaveOutlined
            onClick={() => {
              this.toggleEdit();
              onSave(this.state.note)
            }} /></Col>
        
        </Row>
          <div style={{ borderBottom: "1px solid #ebedf0" }} />
        
        <TextArea value={note} onChange={evt => {
            this.setState({note: evt.currentTarget.value})}
            }></TextArea>
      </React.Fragment>
    );
  };
}

export default SectorNote;
