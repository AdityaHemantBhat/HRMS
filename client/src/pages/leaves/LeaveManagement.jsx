import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Modal, Form, Select, DatePicker, Input, Row, Col, Statistic, Checkbox } from 'antd';
import { message } from '../../utils/notification';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useGetLeaveBalanceQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from '../../features/leaves/leaveApiSlice';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LeaveManagement = () => {
  const user = useSelector(selectCurrentUser);
  const isManager = ['ADMIN', 'HR', 'TEAM_LEAD'].includes(user?.role);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [form] = Form.useForm();

  const { data: leavesData, isLoading } = useGetLeavesQuery();
  const { data: balanceData } = useGetLeaveBalanceQuery();
  const [applyLeave, { isLoading: isApplying }] = useApplyLeaveMutation();
  const [approveLeave] = useApproveLeaveMutation();
  const [rejectLeave] = useRejectLeaveMutation();

  const handleApplyLeave = async (values) => {
    try {
      const formData = {
        leaveType: values.leaveType,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        halfDay: values.halfDay || false,
        reason: values.reason,
      };
      
      await applyLeave(formData).unwrap();
      message.success('Leave application submitted successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to apply for leave');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveLeave(id).unwrap();
      message.success('Leave approved successfully!');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectLeave({ id, rejectionReason: 'Not approved' }).unwrap();
      message.success('Leave rejected!');
    } catch (error) {
      message.error(error?.data?.message || 'Failed to reject leave');
    }
  };

  const columns = [
    ...(isManager ? [{
      title: 'Employee ID',
      key: 'employeeId',
      render: (_, record) => record.employee?.employeeId || 'N/A',
    },
    {
      title: 'Employee Name',
      key: 'employeeName',
      render: (_, record) => `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`,
    }] : []),
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => type.replace('_', ' '),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Days',
      key: 'days',
      render: (_, record) => {
        const days = dayjs(record.endDate).diff(dayjs(record.startDate), 'day') + 1;
        return days;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          APPROVED: 'green',
          PENDING: 'orange',
          REJECTED: 'red',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedLeave(record);
              setIsViewModalOpen(true);
            }}
          >
            View
          </Button>
          {isManager && record.status === 'PENDING' && (
            <>
              <Button type="link" onClick={() => handleApprove(record.id)}>
                Approve
              </Button>
              <Button type="link" danger onClick={() => handleReject(record.id)}>
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Leave Management</h1>
        <Button type="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Apply Leave
        </Button>
      </div>

      {balanceData?.data && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {balanceData.data.map((balance) => (
            <Col xs={24} sm={12} md={6} key={balance.id}>
              <Card>
                <Statistic
                  title={balance.leaveType.replace('_', ' ')}
                  value={balance.remainingLeaves}
                  suffix={`/ ${balance.totalLeaves}`}
                  valueStyle={{ color: balance.remainingLeaves > 5 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card title={isManager ? "All Leave Requests" : "My Leaves"}>
        <Table
          columns={columns}
          dataSource={leavesData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} leaves`,
          }}
        />
      </Card>

      <Modal
        title="Apply for Leave"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApplyLeave}
        >
          <Form.Item
            label="Leave Type"
            name="leaveType"
            rules={[{ required: true, message: 'Please select leave type!' }]}
          >
            <Select placeholder="Select leave type">
              <Option value="SICK">Sick Leave</Option>
              <Option value="CASUAL">Casual Leave</Option>
              <Option value="PAID">Paid Leave</Option>
              <Option value="EARNED">Earned Leave</Option>
              <Option value="MATERNITY">Maternity Leave</Option>
              <Option value="PATERNITY">Paternity Leave</Option>
              <Option value="HALF_DAY">Half Day</Option>
              <Option value="WFH">Work From Home</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Date Range"
            name="dateRange"
            rules={[{ required: true, message: 'Please select dates!' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item
            name="halfDay"
            valuePropName="checked"
          >
            <Checkbox>Half Day Leave</Checkbox>
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide reason!' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for leave..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isApplying}>
                Submit Application
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

      {/* View Leave Details Modal */}
      <Modal
        title="Leave Details"
        open={isViewModalOpen}
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedLeave(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalOpen(false);
            setSelectedLeave(null);
          }}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedLeave && (
          <div style={{ padding: '16px 0' }}>
            {isManager && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <strong>Employee ID:</strong> {selectedLeave.employee?.employeeId || 'N/A'}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Employee Name:</strong> {selectedLeave.employee?.firstName} {selectedLeave.employee?.lastName}
                </div>
              </>
            )}
            <div style={{ marginBottom: 16 }}>
              <strong>Leave Type:</strong> {selectedLeave.leaveType?.replace('_', ' ')}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Start Date:</strong> {dayjs(selectedLeave.startDate).format('DD MMM YYYY')}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>End Date:</strong> {dayjs(selectedLeave.endDate).format('DD MMM YYYY')}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Total Days:</strong> {dayjs(selectedLeave.endDate).diff(dayjs(selectedLeave.startDate), 'day') + 1}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Status:</strong> <Tag color={
                selectedLeave.status === 'APPROVED' ? 'green' :
                selectedLeave.status === 'PENDING' ? 'orange' : 'red'
              }>{selectedLeave.status}</Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Reason:</strong>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedLeave.reason || 'No reason provided'}
              </div>
            </div>
            {selectedLeave.rejectionReason && (
              <div style={{ marginBottom: 16 }}>
                <strong>Rejection Reason:</strong>
                <div style={{ marginTop: 8, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                  {selectedLeave.rejectionReason}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveManagement;
