import React from 'react';
import { Drawer, List, Badge, Button, Empty, Spin, Typography } from 'antd';
import { CheckCircle, X } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationDrawer = ({ open, onClose }) => {
  // Mock data - replace with actual API call
  const notifications = [];
  const loading = false;

  const handleMarkAsRead = (id) => {
    // Implement mark as read
  };

  const handleMarkAllAsRead = () => {
    // Implement mark all as read
  };

  return (
    <Drawer
      title="Notifications"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      extra={
        notifications.length > 0 && (
          <Button type="link" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                background: item.isRead ? 'transparent' : '#f0f5ff',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
              }}
              actions={[
                !item.isRead && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircle size={16} />}
                    onClick={() => handleMarkAsRead(item.id)}
                  />
                ),
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!item.isRead && (
                      <Badge status="processing" />
                    )}
                    <Text strong>{item.title}</Text>
                  </div>
                }
                description={
                  <>
                    <Text>{item.message}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default NotificationDrawer;
