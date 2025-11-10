import React, { useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Select, DatePicker, Statistic, Row, Col } from 'antd';
import { message } from '../../utils/notification';
import { Download, Plus, FileText, Calculator } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetPayrollsQuery, useGeneratePayrollMutation } from '../../features/payroll/payrollApiSlice';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

const { Option } = Select;

const PayrollList = () => {
  const user = useSelector(selectCurrentUser);
  const isHR = ['ADMIN', 'HR'].includes(user?.role);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: payrollData, isLoading } = useGetPayrollsQuery();
  const [generatePayroll, { isLoading: isGenerating }] = useGeneratePayrollMutation();

  // Filter payroll data based on user role
  const filteredPayrollData = React.useMemo(() => {
    if (!payrollData?.data) return [];
    
    // If employee, show only their own payroll
    if (!isHR) {
      return payrollData.data.filter(
        (payroll) => payroll.employee?.id === user?.employee?.id
      );
    }
    
    // If HR/Admin, show all payroll
    return payrollData.data;
  }, [payrollData, isHR, user]);

  const handleGeneratePayroll = async (values) => {
    try {
      await generatePayroll({
        month: values.month.month() + 1,
        year: values.month.year(),
      }).unwrap();
      message.success('Payroll generated successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/${payrollId}/payslip`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Payslip downloaded successfully!');
    } catch (error) {
      message.error('Failed to download payslip');
    }
  };

  // Conditionally show Employee column only for HR/Admin
  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month, record) => dayjs().month(month - 1).year(record.year).format('MMMM YYYY'),
    },
    ...(isHR ? [{
      title: 'Employee',
      key: 'employee',
      render: (_, record) => `${record.employee?.firstName} ${record.employee?.lastName}`,
    }] : []),
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      render: (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      render: (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#10b981' }}>
          ₹{parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          DRAFT: 'orange',
          FINALIZED: 'green',
          PAID: 'blue',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<Download size={16} />}
          onClick={() => handleDownloadPayslip(record.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payroll Management</h1>
          <p>Manage employee payroll and download payslips</p>
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
            Generate Payroll
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredPayrollData}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} payroll records`,
          }}
        />
      </Card>

      <Modal
        title="Generate Monthly Payroll"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGeneratePayroll}
        >
          <Form.Item
            label="Select Month & Year"
            name="month"
            rules={[{ required: true, message: 'Please select month!' }]}
          >
            <DatePicker
              picker="month"
              style={{ width: '100%' }}
              format="MMMM YYYY"
              disabledDate={(current) => current && current > dayjs().endOf('month')}
            />
          </Form.Item>

          <div style={{ 
            background: '#f0f9ff', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
              <FileText size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              This will generate payroll for all active employees for the selected month.
            </p>
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isGenerating} icon={<Calculator size={16} />}>
                Generate Payroll
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

export default PayrollList;
