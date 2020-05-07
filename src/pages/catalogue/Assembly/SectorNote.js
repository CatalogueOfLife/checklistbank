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
          <Col span={12} style={{ textAlign: "right" }}>
          { note ? 'Edit' : 'Write'} <EditOutlined onClick={this.toggleEdit} />
          </Col>
        
        </Row>
        {note && (
          <div
            style={{
                borderTop: "1px solid #ebedf0"
            }}
          >
            
            <p>{note}</p>
          </div>
        )}
       
      </React.Fragment>
    ) : (
      <React.Fragment>
          <Row>
          <Col span={12}>Note</Col>
          <Col span={12} style={{ textAlign: "right" }}>
          Save <SaveOutlined
            onClick={() => {
              this.toggleEdit();
              onSave(this.state.note)
            }} />
          </Col>
        
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
