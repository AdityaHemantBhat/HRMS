import React, { useState } from 'react';
import { Card, Descriptions, Avatar, Button, Tabs, Modal, Form, Input } from 'antd';
import { message } from '../utils/notification';
import { User, Lock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useUpdatePasswordMutation } from '../features/auth/authApiSlice';

const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [updatePassword, { isLoading: isUpdating }] = useUpdatePasswordMutation();

  const handlePasswordUpdate = async (values) => {
    try {
      await updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      message.success('Password updated successfully!');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to update password');
    }
  };

  const items = [
    {
      key: 'personal',
      label: 'Personal Information',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="First Name">{user?.employee?.firstName}</Descriptions.Item>
          <Descriptions.Item label="Last Name">{user?.employee?.lastName}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="Employee ID">{user?.employee?.employeeId}</Descriptions.Item>
          <Descriptions.Item label="Department">{user?.employee?.department}</Descriptions.Item>
          <Descriptions.Item label="Designation">{user?.employee?.designation}</Descriptions.Item>
          <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'security',
      label: 'Security',
      children: (
        <Card>
          <h3>Change Password</h3>
          <Button 
            type="primary" 
            icon={<Lock size={18} />}
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Update Password
          </Button>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={100} style={{ backgroundColor: '#1890ff' }}>
            {user?.employee?.firstName?.[0]}
            {user?.employee?.lastName?.[0]}
          </Avatar>
          <h2 style={{ marginTop: 16, marginBottom: 4 }}>
            {user?.employee?.firstName} {user?.employee?.lastName}
          </h2>
          <p style={{ color: '#8c8c8c' }}>{user?.employee?.designation}</p>
        </div>

        <Tabs items={items} />
      </Card>

      <Modal
        title="Update Password"
        open={isPasswordModalOpen}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordUpdate}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: 'Please enter your current password!' },
            ]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isUpdating} block>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
