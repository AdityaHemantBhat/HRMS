import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag } from 'antd';
import { message } from '../../utils/notification';
import { Plus, Edit, Trash2 } from 'lucide-react';

const LeaveTypeSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [form] = Form.useForm();

  // This will be replaced with API calls
  const [leaveTypes, setLeaveTypes] = useState([
    { id: 1, name: 'Sick Leave', code: 'SICK', defaultQuota: 12, carryForward: true, description: 'For medical reasons' },
    { id: 2, name: 'Casual Leave', code: 'CASUAL', defaultQuota: 10, carryForward: false, description: 'For personal reasons' },
  ]);

  const handleSubmit = async (values) => {
    try {
      if (editingLeave) {
        // Update existing
        setLeaveTypes(leaveTypes.map(lt => 
          lt.id === editingLeave.id ? { ...lt, ...values } : lt
        ));
        message.success('Leave type updated successfully!');
      } else {
        // Add new
        const newLeaveType = {
          id: Date.now(),
          ...values,
        };
        setLeaveTypes([...leaveTypes, newLeaveType]);
        message.success('Leave type added successfully!');
      }
      setIsModalOpen(false);
      setEditingLeave(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save leave type');
    }
  };

  const handleEdit = (record) => {
    setEditingLeave(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Leave Type',
      content: 'Are you sure you want to delete this leave type?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
        message.success('Leave type deleted successfully!');
      },
    });
  };

  const columns = [
    {
      title: 'Leave Type',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Default Quota',
      dataIndex: 'defaultQuota',
      key: 'defaultQuota',
      render: (quota) => `${quota} days/year`,
    },
    {
      title: 'Carry Forward',
      dataIndex: 'carryForward',
      key: 'carryForward',
      render: (carryForward) => (
        <Tag color={carryForward ? 'green' : 'red'}>
          {carryForward ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leave Type Configuration</h1>
          <p>Manage leave types and their quotas for all employees</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingLeave(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Add Leave Type
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={leaveTypes}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingLeave ? 'Edit Leave Type' : 'Add Leave Type'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingLeave(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Leave Type Name"
            name="name"
            rules={[{ required: true, message: 'Please enter leave type name!' }]}
          >
            <Input placeholder="e.g., Sick Leave" />
          </Form.Item>

          <Form.Item
            label="Code"
            name="code"
            rules={[{ required: true, message: 'Please enter code!' }]}
          >
            <Input placeholder="e.g., SICK" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            label="Default Annual Quota (Days)"
            name="defaultQuota"
            rules={[{ required: true, message: 'Please enter quota!' }]}
          >
            <InputNumber
              min={0}
              max={365}
              style={{ width: '100%' }}
              placeholder="12"
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <Input.TextArea rows={3} placeholder="Brief description of this leave type" />
          </Form.Item>

          <Form.Item
            label="Allow Carry Forward to Next Year"
            name="carryForward"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingLeave ? 'Update' : 'Add'} Leave Type
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                setEditingLeave(null);
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

export default LeaveTypeSettings;
