import React, { Component } from "react"
import injectSheet from 'react-jss'
import { Tooltip, Icon, Row, Col } from "antd"

const styles = theme => ({
  formItem: {
    marginBottom: 24
  },
  label: {
    textAlign: 'right',
    verticalAlign: 'middle',
    lineHeight: '40px',
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: 'rgba(0, 0, 0, 0.85)',
    '&:after': {
      content: '":"',
      margin: '0 8px 0 2px',
      position: 'relative',
      top: '-0.5px'
    }
  },
  content: {
    paddingTop: 9
  }
})

class TextField extends Component {
  render() {
    const { classes, children, label, helpText } = this.props;
    return (
      <Row>
        <Col md={24} lg={4}>
          <div>
            <dt className={classes.label}>
              {label}
              {helpText && <React.Fragment>&nbsp;
                <Tooltip title={helpText}>
                  <Icon type="question-circle-o" />
                </Tooltip>
              </React.Fragment>}
            </dt>
          </div>
        </Col>
        <Col md={24} lg={16}>
          <dd className={classes.content}>
            {children}
          </dd>
        </Col>
      </Row>
    );
  }
}

export default injectSheet(styles)(TextField)
