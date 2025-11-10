import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, message, Tag, Popconfirm } from 'antd';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

const { TextArea } = Input;

const DepartmentManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form] = Form.useForm();

  // This will be replaced with API calls
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Engineering', code: 'ENG', description: 'Software development and technical teams', employeeCount: 25 },
    { id: 2, name: 'Human Resources', code: 'HR', description: 'HR and recruitment', employeeCount: 5 },
    { id: 3, name: 'Sales', code: 'SALES', description: 'Sales and business development', employeeCount: 15 },
    { id: 4, name: 'Marketing', code: 'MKT', description: 'Marketing and communications', employeeCount: 8 },
  ]);

  const handleSubmit = async (values) => {
    try {
      if (editingDepartment) {
        // Update existing
        setDepartments(departments.map(dept => 
          dept.id === editingDepartment.id 
            ? { ...dept, ...values }
            : dept
        ));
        message.success('Department updated successfully!');
      } else {
        // Add new
        const newDepartment = {
          id: Date.now(),
          ...values,
          employeeCount: 0,
        };
        setDepartments([...departments, newDepartment]);
        message.success('Department added successfully!');
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save department');
    }
  };

  const handleEdit = (record) => {
    setEditingDepartment(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const dept = departments.find(d => d.id === id);
    if (dept.employeeCount > 0) {
      message.error('Cannot delete department with existing employees. Please reassign employees first.');
      return;
    }
    setDepartments(departments.filter(d => d.id !== id));
    message.success('Department deleted successfully!');
  };

  const columns = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <Building2 size={16} style={{ color: '#6366f1' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count} {count === 1 ? 'employee' : 'employees'}
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
          <Popconfirm
            title="Delete Department"
            description={
              record.employeeCount > 0
                ? "This department has employees. Please reassign them before deleting."
                : "Are you sure you want to delete this department?"
            }
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, disabled: record.employeeCount > 0 }}
          >
            <Button 
              type="link" 
              danger 
              icon={<Trash2 size={16} />}
              disabled={record.employeeCount > 0}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Department Management</h1>
          <p>Manage company departments and organizational structure</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingDepartment(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Add Department
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingDepartment(null);
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
            label="Department Name"
            name="name"
            rules={[{ required: true, message: 'Please enter department name!' }]}
          >
            <Input placeholder="e.g., Engineering" />
          </Form.Item>

          <Form.Item
            label="Department Code"
            name="code"
            rules={[
              { required: true, message: 'Please enter department code!' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Code must be uppercase letters, numbers, or underscores' }
            ]}
          >
            <Input 
              placeholder="e.g., ENG" 
              style={{ textTransform: 'uppercase' }}
              maxLength={10}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <TextArea rows={3} placeholder="Brief description of this department" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingDepartment ? 'Update' : 'Add'} Department
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                setEditingDepartment(null);
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

export default DepartmentManagement;
