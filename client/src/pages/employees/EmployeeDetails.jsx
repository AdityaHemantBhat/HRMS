import React from 'react';
import { Card, Descriptions, Tag, Button, Spin, Result, Popconfirm, message, Space } from 'antd';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetEmployeeQuery, useDeleteEmployeeMutation } from '../../features/employees/employeeApiSlice';
import dayjs from 'dayjs';

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'ADMIN';
  
  const { data, isLoading, error } = useGetEmployeeQuery(id);
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const employee = data?.data;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Result
        status="404"
        title="Employee Not Found"
        subTitle="The employee you're looking for doesn't exist."
        extra={
          <Button type="primary" onClick={() => navigate('/employees')}>
            Back to Employees
          </Button>
        }
      />
    );
  }

  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployee(id).unwrap();
      message.success('Employee deleted successfully!');
      navigate('/employees');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to delete employee');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeft size={18} />} 
          onClick={() => navigate('/employees')}
        >
          Back
        </Button>
        
        {isAdmin && (
          <Popconfirm
            title="Delete Employee"
            description={`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This will permanently delete all their data including attendance, leaves, and payroll records.`}
            onConfirm={handleDeleteEmployee}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: isDeleting }}
            placement="bottomRight"
          >
            <Button danger icon={<Trash2 size={18} />} loading={isDeleting}>
              Delete Employee
            </Button>
          </Popconfirm>
        )}
      </div>

      <Card title={`Employee Details - ${employee.firstName} ${employee.lastName}`}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Employee ID">{employee.employeeId}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">Active</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Full Name">
            {employee.firstName} {employee.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{employee.user?.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Department">{employee.department}</Descriptions.Item>
          <Descriptions.Item label="Designation">{employee.designation}</Descriptions.Item>
          <Descriptions.Item label="Phone">{employee.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('DD MMM YYYY') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">{employee.gender || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Joining Date">
            {dayjs(employee.joiningDate).format('DD MMM YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Base Salary">
            ₹{parseFloat(employee.baseSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {employee.address || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default EmployeeDetails;
