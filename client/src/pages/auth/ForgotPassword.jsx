import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Result } from 'antd';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../features/auth/authApiSlice';
import '../../styles/auth.scss';

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onFinish = async (values) => {
    try {
      await forgotPassword(values).unwrap();
      setEmailSent(true);
      message.success('Password reset email sent!');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to send reset email.');
    }
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <Card className="auth-card">
            <Result
              status="success"
              title="Email Sent!"
              subTitle="Please check your email for password reset instructions."
              extra={
                <Link to="/login">
                  <Button type="primary" size="large">
                    Back to Login
                  </Button>
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <h1 className="auth-logo">TalentSphere</h1>
          <p className="auth-subtitle">Enterprise HRMS System</p>
        </div>

        <Card className="auth-card">
          <Link to="/login" className="back-link">
            <ArrowLeft size={18} /> Back to Login
          </Link>

          <h2 className="auth-title">Forgot Password?</h2>
          <p className="auth-description">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <Form
            name="forgot-password"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<Mail size={18} />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                Send Reset Link
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className="auth-footer">
          <p>&copy; 2024 TalentSphere. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
