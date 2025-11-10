import React, { useEffect } from 'react';
import { Form, Input, Button, Card } from 'antd';
import { message } from '../../utils/notification';
import { Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../features/auth/authApiSlice';
import { setCredentials, selectIsAuthenticated } from '../../features/auth/authSlice';
import '../../styles/auth.scss';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    try {
      const result = await login(values).unwrap();
      
      // Save token to localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      
      dispatch(setCredentials(result.user));
      message.success('Login successful!');
      navigate('/');
    } catch (error) {
      message.error(error?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <div className="company-logo">
            <div className="default-logo">TS</div>
          </div>
          <h1 className="auth-logo">TalentSphere</h1>
          <p className="auth-subtitle">Enterprise Human Resource Management</p>
        </div>

        <Card className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-description">Sign in to access your workspace</p>

          <Form
            name="login"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<Mail size={18} style={{ color: '#8c8c8c' }} />}
                placeholder="Enter your email"
                style={{ height: '48px' }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<Lock size={18} style={{ color: '#8c8c8c' }} />}
                placeholder="Enter your password"
                style={{ height: '48px' }}
              />
            </Form.Item>

            <Form.Item>
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <Link to="/forgot-password" className="auth-link">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>
        </Card>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '13px'
        }}>
          <p> 2024 TalentSphere. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
