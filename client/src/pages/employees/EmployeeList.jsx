import React, { useState } from 'react';
import { Card, Table, Button, Input, Tag, Space, Modal, Form, Select, DatePicker, InputNumber, Popconfirm } from 'antd';
import { message } from '../../utils/notification';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetEmployeesQuery, useCreateEmployeeMutation, useDeleteEmployeeMutation } from '../../features/employees/employeeApiSlice';

const { Option } = Select;

const EmployeeList = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isHR = ['ADMIN', 'HR'].includes(user?.role);
  
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useGetEmployeesQuery({ search: searchText });
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.user?.isActive ? 'green' : 'red'}>
          {record.user?.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/employees/${record.id}`)}>
            View
          </Button>
          {isHR && user?.role === 'ADMIN' && (
            <Popconfirm
              title="Delete Employee"
              description={`Are you sure you want to delete ${record.firstName} ${record.lastName}? This will permanently delete all their data including attendance, leaves, and payroll records.`}
              onConfirm={() => handleDeleteEmployee(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              placement="topRight"
            >
              <Button type="link" danger icon={<Trash2 size={16} />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAddEmployee = async (values) => {
    try {
      await createEmployee({
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        joiningDate: values.joiningDate?.format('YYYY-MM-DD'),
      }).unwrap();
      message.success('Employee created successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to create employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await deleteEmployee(id).unwrap();
      message.success('Employee deleted successfully!');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to delete employee');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <Button type="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Add Employee
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search employees..."
            prefix={<Search size={18} />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={data?.data || []} 
          loading={isLoading}
          rowKey="id"
          pagination={{
            total: data?.total,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>

      <Modal
        title="Add New Employee"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEmployee}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="employee@example.com" />
          </Form.Item>

          <Form.Item
            label="Initial Password"
            name="password"
            rules={[{ required: true, message: 'Please input password!' }]}
          >
            <Input.Password placeholder="Initial password" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            initialValue="EMPLOYEE"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="EMPLOYEE">Employee</Option>
              {isHR && <Option value="TEAM_LEAD">Team Lead</Option>}
              {isHR && <Option value="HR">HR</Option>}
              {isHR && <Option value="ADMIN">Admin</Option>}
            </Select>
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Required!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Required!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="Employee ID"
              name="employeeId"
              rules={[{ required: true, message: 'Required!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input placeholder="EMP001" />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="Department"
              name="department"
              rules={[{ required: true, message: 'Required!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select>
                <Option value="Engineering">Engineering</Option>
                <Option value="Marketing">Marketing</Option>
                <Option value="Sales">Sales</Option>
                <Option value="Finance">Finance</Option>
                <Option value="HR">HR</Option>
                <Option value="Operations">Operations</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Designation"
              name="designation"
              rules={[{ required: true, message: 'Required!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input placeholder="Software Developer" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              style={{ flex: 1, minWidth: 200 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Joining Date"
              name="joiningDate"
              style={{ flex: 1, minWidth: 200 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            label="Base Salary"
            name="baseSalary"
            rules={[{ required: true, message: 'Required!' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              placeholder="50000"
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Create Employee
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

export default EmployeeList;
