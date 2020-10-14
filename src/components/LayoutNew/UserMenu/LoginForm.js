import React from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Input, Button, Checkbox, Alert, Form } from 'antd';
const FormItem = Form.Item;



const LoginForm = ({onLogin, invalid}) => {
  const [form] = Form.useForm();

  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };

  const onFinish = (values) => {
    onLogin(values)
  }

  return (
    <Form onFinish={onFinish} onFinishFailed={onFinishFailed} initialValues={{
      remember: true,
    }}>
      <FormItem rules={[{ required: true, message: 'Please enter your GBIF username!' }]} name="username">
        <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
      </FormItem>
      <FormItem rules={[{ required: true, message: 'Please enter your GBIF password!' }]} name="password">
        <Input prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
      </FormItem>
      <FormItem style={{width: '100%'}} valuePropName="checked" name="remember">
        <Checkbox>Remember me</Checkbox>
        <Button type="primary" htmlType="submit" style={{width: '100%'}}>
          Log in
        </Button>
        Or <a href="https://www.gbif.org/user/profile">register at gbif.org now!</a>
      </FormItem>
      {invalid && <FormItem style={{width: '100%'}}><Alert message={invalid} type="error" /></FormItem>}

      <FormItem><a className="login-form-forgot" href="https://www.gbif.org/user/profile">Forgot password?</a></FormItem>
    </Form>
  );

}

export default LoginForm;