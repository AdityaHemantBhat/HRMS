import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Checkbox, Space, message, Tag, Divider } from 'antd';
import { Shield, Edit } from 'lucide-react';

const RolePermissions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();

  // Available permissions grouped by module
  const permissionModules = {
    employees: {
      label: 'Employee Management',
      permissions: [
        { key: 'view_employees', label: 'View Employees' },
        { key: 'create_employees', label: 'Create Employees' },
        { key: 'edit_employees', label: 'Edit Employees' },
        { key: 'delete_employees', label: 'Delete Employees' },
      ]
    },
    attendance: {
      label: 'Attendance',
      permissions: [
        { key: 'view_attendance', label: 'View Attendance' },
        { key: 'mark_attendance', label: 'Mark Attendance' },
        { key: 'edit_attendance', label: 'Edit Attendance' },
        { key: 'view_reports', label: 'View Reports' },
      ]
    },
    leaves: {
      label: 'Leave Management',
      permissions: [
        { key: 'apply_leave', label: 'Apply Leave' },
        { key: 'view_leaves', label: 'View All Leaves' },
        { key: 'approve_leave', label: 'Approve/Reject Leave' },
        { key: 'manage_leave_types', label: 'Manage Leave Types' },
      ]
    },
    payroll: {
      label: 'Payroll',
      permissions: [
        { key: 'view_own_payroll', label: 'View Own Payroll' },
        { key: 'view_all_payroll', label: 'View All Payroll' },
        { key: 'generate_payroll', label: 'Generate Payroll' },
        { key: 'download_payslips', label: 'Download Payslips' },
      ]
    },
    projects: {
      label: 'Project Management',
      permissions: [
        { key: 'view_all_projects', label: 'View All Projects' },
        { key: 'view_assigned_projects', label: 'View Assigned Projects' },
        { key: 'create_projects', label: 'Create Projects' },
        { key: 'edit_projects', label: 'Edit Projects' },
        { key: 'delete_projects', label: 'Delete Projects' },
        { key: 'assign_employees', label: 'Assign Employees to Projects' },
        { key: 'mark_complete', label: 'Mark Projects as Complete' },
        { key: 'create_tasks', label: 'Create Tasks' },
        { key: 'assign_tasks', label: 'Assign Tasks' },
        { key: 'update_progress', label: 'Update Project Progress' },
      ]
    },
    settings: {
      label: 'Settings',
      permissions: [
        { key: 'manage_departments', label: 'Manage Departments' },
        { key: 'manage_holidays', label: 'Manage Holidays' },
        { key: 'manage_roles', label: 'Manage Roles & Permissions' },
        { key: 'system_settings', label: 'System Settings' },
      ]
    },
  };

  // Roles with their current permissions
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'ADMIN',
      label: 'Administrator',
      description: 'Full system access',
      permissions: Object.values(permissionModules).flatMap(m => m.permissions.map(p => p.key)),
      isSystem: true,
    },
    {
      id: 2,
      name: 'HR',
      label: 'Human Resources',
      description: 'HR and employee management',
      permissions: [
        'view_employees', 'create_employees', 'edit_employees',
        'view_attendance', 'view_reports',
        'view_leaves', 'approve_leave', 'manage_leave_types',
        'view_all_payroll', 'generate_payroll', 'download_payslips',
        'view_all_projects', 'create_projects', 'edit_projects', 'assign_employees', 'mark_complete', 'create_tasks', 'assign_tasks',
        'manage_departments', 'manage_holidays',
      ],
      isSystem: true,
    },
    {
      id: 3,
      name: 'TEAM_LEAD',
      label: 'Team Lead',
      description: 'Team management and oversight',
      permissions: [
        'view_employees',
        'view_attendance', 'mark_attendance', 'view_reports',
        'view_leaves', 'approve_leave',
        'view_own_payroll',
        'view_all_projects', 'create_projects', 'edit_projects', 'assign_employees', 'mark_complete', 'create_tasks', 'assign_tasks', 'update_progress',
      ],
      isSystem: false,
    },
    {
      id: 4,
      name: 'EMPLOYEE',
      label: 'Employee',
      description: 'Basic employee access',
      permissions: [
        'mark_attendance',
        'apply_leave',
        'view_own_payroll',
        'view_assigned_projects',
      ],
      isSystem: false,
    },
  ]);

  const handleEditPermissions = (role) => {
    setSelectedRole(role);
    form.setFieldsValue({
      permissions: role.permissions,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setRoles(roles.map(role =>
        role.id === selectedRole.id
          ? { ...role, permissions: values.permissions || [] }
          : role
      ));
      message.success('Permissions updated successfully!');
      setIsModalOpen(false);
      setSelectedRole(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update permissions');
    }
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => (
        <Space>
          <Shield size={16} style={{ color: '#6366f1' }} />
          <div>
            <div><strong>{text}</strong></div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.name}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Tag color="blue">{permissions.length} permissions</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag color={isSystem ? 'red' : 'green'}>
          {isSystem ? 'System Role' : 'Custom Role'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<Edit size={16} />}
          onClick={() => handleEditPermissions(record)}
          disabled={record.name === 'ADMIN'}
        >
          Edit Permissions
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Role & Permissions Management</h1>
          <p>Configure role-based access control and permissions</p>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={`Edit Permissions - ${selectedRole?.label}`}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedRole(null);
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
          <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
            <strong>Role:</strong> {selectedRole?.label} ({selectedRole?.name})
            <br />
            <span style={{ fontSize: '13px', color: '#666' }}>{selectedRole?.description}</span>
          </div>

          <Form.Item name="permissions" valuePropName="value">
            <Checkbox.Group style={{ width: '100%' }}>
              {Object.entries(permissionModules).map(([moduleKey, module]) => (
                <div key={moduleKey} style={{ marginBottom: 24 }}>
                  <Divider orientation="left" style={{ marginTop: 0 }}>
                    <strong>{module.label}</strong>
                  </Divider>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', paddingLeft: '24px' }}>
                    {module.permissions.map(permission => (
                      <Checkbox key={permission.key} value={permission.key}>
                        {permission.label}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Permissions
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                setSelectedRole(null);
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

export default RolePermissions;
