import React from 'react';
import PropTypes from 'prop-types';
import { PlusOutlined } from '@ant-design/icons';
import { Row, Tag, Col } from 'antd';
import injectSheet from 'react-jss';
import PersonForm from './PersonForm'
import PersonPresentation from './PersonPresentation'
import ReactDragListView from 'react-drag-listview'
const { DragColumn } = ReactDragListView;


const stringToArray = value => {
    if (Array.isArray(value)) {
      return value;
    } else if (value) {
      return [value];
    }
  
    return [];
  };

const styles = {
  newTag: {
    background: '#fff',
    borderStyle: 'dashed',
    maxHeight: '22px'
  }
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
class PersonControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ('value' in nextProps) {
      let value = stringToArray(nextProps.value);

      return { persons: value };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      persons: stringToArray(props.value),
      formVisible: false,
      personForEdit: null
    };
  }

  handleClose = removedTag => {
    const persons = this.state.persons.filter(tag => tag !== removedTag);
    const {array = true} = this.props
    this.setState({ persons });
    this.triggerChange(array ? persons : null);
  };

  showForm = (person) => {
    this.setState({ personForEdit: person, formVisible: true });
  };

  handleInputChange = event => {
    this.setState({ inputValue: event.target.value });
  };

  onFormSubmit = (person) => {

    const persons = [...this.state.persons, person];
    const {array = true} = this.props
    this.setState({
      persons,
      formVisible: false,
    }, () => this.triggerChange(array ? persons : person));  
  };

  triggerChange = changedValue => {
    // Should provide an event to pass value to Form
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(changedValue);
    }
  };

  onDragEnd = (fromIndex, toIndex) => {
    const persons = [...this.state.persons];
    const person = persons.splice(fromIndex, 1)[0];
    persons.splice(toIndex, 0, person);
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(persons); // will get derived state from props
    }
  }

  render() {
    const { persons, formVisible, inputValue } = this.state;
    const { classes, label, removeAll, array = true } = this.props;

    const dragProps = {
        onDragEnd: this.onDragEnd,
        nodeSelector: 'li',
        handleSelector: 'li'
      }

    return (
      <React.Fragment>
        <Row><DragColumn {...dragProps}> 
          <ol style={{listStyle : 'none', paddingInlineStart: '0px'}}>
        {persons.map((person, index) => {
          
          const tagElem = (
           <li style={{float: 'left', marginBottom: '4px'}}> <Tag key={person.familyName+person.givenName} closable={removeAll || index !== 0} onClose={() => this.handleClose(person)}>
              <PersonPresentation person={person} style={{display: 'inline-grid', margin: '3px 0px 3px 0px'}} />
              
            </Tag>
            </li>
          );
          return  tagElem;
        })}
        </ol>
        </DragColumn>
        

        {!formVisible && (array ||  persons.length === 0) && (
          <Tag onClick={this.showForm} className={classes.newTag}>
            <PlusOutlined /> {label}
          </Tag>
        )}
        </Row> 
                {formVisible && (
           <Row><Col span={24}><PersonForm style={{marginTop: '10px'}} onSubmit={this.onFormSubmit} onCancel={() => this.setState({formVisible: false})}/></Col> </Row>
        )}
      </React.Fragment>
    );
  }
}

PersonControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool // optional flag, to allow remove all persons or not
};

export default injectSheet(styles)(PersonControl);