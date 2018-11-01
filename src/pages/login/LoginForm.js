import React from "react";
import {
    Redirect,
    withRouter
  } from 'react-router-dom'
import { Form, Icon, Input, Button, Card } from 'antd';
import Auth from '../../components/Auth/Auth'
import _ from 'lodash'


const FormItem = Form.Item;

class LoginForm extends React.Component {
    state = {
        redirectToReferrer: false
    }
    
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
                Auth.authenticate(values, () => {
                    this.setState({
                        redirectToReferrer: true
                    })
                })
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const { from } = _.get(this.props, 'location.state') || { from: { pathname: '/' } }
        const { redirectToReferrer } = this.state

        if (redirectToReferrer === true) {
            return <Redirect to={from} />
        }
        return (
            <div align="center">
            <Card style={{maxWidth: '360px'}}>
            <Form onSubmit={this.handleSubmit} className="login-form">
                <FormItem>
                    {getFieldDecorator('username', {
                        rules: [{ required: true, message: 'Please input your username!' }],
                    })(
                        <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
                    )}
                </FormItem>
                <FormItem>
                    {getFieldDecorator('password', {
                        rules: [{ required: true, message: 'Please input your Password!' }],
                    })(
                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                    )}
                </FormItem>
                <FormItem>
                   
                    <a className="login-form-forgot" href="https://www.gbif.org/user/profile">Forgot password</a>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Log in
          </Button>
                    Or <a href="https://www.gbif.org/user/profile">register now!</a>
                </FormItem>
            </Form>
            </Card>
            </div>
        );
    }
}

const WrappedLoginForm = Form.create()(LoginForm);

export default WrappedLoginForm;