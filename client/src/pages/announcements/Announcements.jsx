import React, { useState } from 'react';
import { Card, Button, List, Modal, Form, Input, Select, Tag, Space, Avatar } from 'antd';
import { message } from '../../utils/notification';
import { Plus, Megaphone, Users, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useGetAnnouncementsQuery, useCreateAnnouncementMutation } from '../../features/notifications/notificationApiSlice';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Option } = Select;

const Announcements = () => {
  const user = useSelector(selectCurrentUser);
  const isHR = ['ADMIN', 'HR'].includes(user?.role);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: announcementsData, isLoading } = useGetAnnouncementsQuery();
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();

  const handleSubmit = async (values) => {
    try {
      await createAnnouncement(values).unwrap();
      message.success('Announcement published successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to create announcement');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'blue',
      MEDIUM: 'orange',
      HIGH: 'red',
      URGENT: 'purple',
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'HIGH' || priority === 'URGENT') {
      return <AlertCircle size={16} />;
    }
    return <Megaphone size={16} />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p>Company-wide announcements and important updates</p>
        </div>
        {isHR && (
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => {
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            New Announcement
          </Button>
        )}
      </div>

      <Card>
        <List
          loading={isLoading}
          dataSource={announcementsData?.data || []}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '24px',
                marginBottom: '16px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}
                    icon={getPriorityIcon(item.priority)}
                  />
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.title}</span>
                    <Tag color={getPriorityColor(item.priority)} icon={getPriorityIcon(item.priority)}>
                      {item.priority}
                    </Tag>
                    {item.targetRole && item.targetRole !== 'ALL' && (
                      <Tag icon={<Users size={14} />}>
                        {item.targetRole}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <p style={{ fontSize: '15px', color: '#595959', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                      {item.message}
                    </p>
                    <Space size="large">
                      <span style={{ fontSize: '13px', color: '#8c8c8c' }}>
                        📅 {dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A')}
                      </span>
                      <span style={{ fontSize: '13px', color: '#8c8c8c' }}>
                        👤 Posted by {item.createdBy?.employee?.firstName} {item.createdBy?.employee?.lastName}
                      </span>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Megaphone size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
                <p style={{ color: '#8c8c8c', fontSize: '16px' }}>No announcements yet</p>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Create Announcement"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title!' }]}
          >
            <Input placeholder="e.g., Office Closure Notice" size="large" />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter message!' }]}
          >
            <TextArea
              rows={6}
              placeholder="Write your announcement message here..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="Priority"
              name="priority"
              initialValue="MEDIUM"
              rules={[{ required: true }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select>
                <Option value="LOW">Low</Option>
                <Option value="MEDIUM">Medium</Option>
                <Option value="HIGH">High</Option>
                <Option value="URGENT">Urgent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Target Audience"
              name="targetRole"
              initialValue="ALL"
              rules={[{ required: true }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select>
                <Option value="ALL">All Employees</Option>
                <Option value="ADMIN">Admins Only</Option>
                <Option value="HR">HR Team</Option>
                <Option value="TEAM_LEAD">Team Leads</Option>
                <Option value="EMPLOYEE">Employees</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating} icon={<Megaphone size={16} />}>
                Publish Announcement
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcements;
