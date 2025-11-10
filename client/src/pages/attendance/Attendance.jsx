import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, DatePicker, Statistic, Tooltip, Alert, Tabs } from 'antd';
import { message } from '../../utils/notification';
import { Clock, Coffee, AlertCircle, Users } from 'lucide-react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetAllAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
} from '../../features/attendance/attendanceApiSlice';

const { TabPane } = Tabs;

const Attendance = () => {
  const [dateRange, setDateRange] = useState(null);
  const user = useSelector(selectCurrentUser);
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  const { data: todayData, refetch: refetchToday } = useGetTodayAttendanceQuery();
  const { data: historyData, isLoading } = useGetMyAttendanceQuery({
    month: dateRange ? dayjs(dateRange[0]).month() + 1 : undefined,
    year: dateRange ? dayjs(dateRange[0]).year() : undefined,
  });
  
  // Get today's attendance for all employees (Admin/HR only)
  const today = dayjs().format('YYYY-MM-DD');
  const { data: allTodayAttendance, isLoading: isLoadingAllToday, refetch: refetchAllToday } = useGetAllAttendanceQuery(
    {
      startDate: today,
      endDate: today,
      limit: 1000,
    },
    {
      skip: !isAdminOrHR,
    }
  );

  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [startBreak, { isLoading: isStartingBreak }] = useStartBreakMutation();
  const [endBreak, { isLoading: isEndingBreak }] = useEndBreakMutation();

  const todayAttendance = todayData?.data?.attendance;
  const ongoingBreak = todayData?.data?.ongoingBreak;

  const handleCheckIn = async () => {
    try {
      await checkIn().unwrap();
      message.success('Checked in successfully!');
      refetchToday();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    // Extra validation on frontend
    if (!todayAttendance?.checkIn) {
      message.warning({
        content: 'Please check in first before checking out!',
        icon: <AlertCircle size={18} style={{ color: '#faad14' }} />,
        duration: 4,
      });
      return;
    }
    
    try {
      await checkOut().unwrap();
      message.success('Checked out successfully!');
      refetchToday();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to check out');
    }
  };

  const handleStartBreak = async (breakType) => {
    try {
      await startBreak({ breakType }).unwrap();
      message.success(`${breakType} break started!`);
      refetchToday();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      await endBreak().unwrap();
      message.success('Break ended!');
      refetchToday();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to end break');
    }
  };

  // Columns for personal attendance history
  const personalColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time) => time ? dayjs(time).format('hh:mm A') : '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time) => time ? dayjs(time).format('hh:mm A') : '-',
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => hours ? `${hours} hrs` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          PRESENT: 'green',
          LATE: 'orange',
          ABSENT: 'red',
          HALF_DAY: 'blue',
          WFH: 'purple',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  // Columns for today's all employees attendance (Admin/HR)
  const todayAllColumns = [
    {
      title: 'Employee Name',
      key: 'name',
      width: 200,
      render: (_, record) => `${record.employee.firstName} ${record.employee.lastName}`,
      sorter: (a, b) => `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(`${b.employee.firstName} ${b.employee.lastName}`),
    },
    {
      title: 'Employee ID',
      key: 'employeeId',
      width: 130,
      render: (_, record) => record.employee.employeeId,
    },
    {
      title: 'Department',
      key: 'department',
      width: 150,
      render: (_, record) => record.employee.department,
      filters: [
        { text: 'Engineering', value: 'Engineering' },
        { text: 'HR', value: 'HR' },
        { text: 'Sales', value: 'Sales' },
        { text: 'Marketing', value: 'Marketing' },
        { text: 'Finance', value: 'Finance' },
      ],
      onFilter: (value, record) => record.employee.department === value,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 120,
      render: (time) => (
        <Space>
          <Clock size={14} style={{ color: '#52c41a' }} />
          {time ? dayjs(time).format('hh:mm A') : <Tag color="red">Not Checked In</Tag>}
        </Space>
      ),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 120,
      render: (time) => (
        <Space>
          <Clock size={14} style={{ color: '#ff4d4f' }} />
          {time ? dayjs(time).format('hh:mm A') : '-'}
        </Space>
      ),
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 110,
      render: (hours) => hours ? <strong>{hours} hrs</strong> : '-',
      sorter: (a, b) => (a.totalHours || 0) - (b.totalHours || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          PRESENT: 'green',
          LATE: 'orange',
          ABSENT: 'red',
          HALF_DAY: 'blue',
          WFH: 'purple',
        };
        const textMap = {
          PRESENT: 'On Time',
          LATE: 'Late',
          ABSENT: 'Absent',
          HALF_DAY: 'Half Day',
          WFH: 'WFH',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
      filters: [
        { text: 'On Time', value: 'PRESENT' },
        { text: 'Late', value: 'LATE' },
        { text: 'Absent', value: 'ABSENT' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>{isAdminOrHR ? "View today's attendance for all employees" : "Manage your attendance"}</p>
      </div>

      {isAdminOrHR ? (
        // Admin/HR View - Show today's attendance for all employees
        <Card 
          title={
            <Space>
              <Users size={20} />
              <span>Today's Attendance - {dayjs().format('DD MMMM YYYY')}</span>
            </Space>
          }
          extra={
            <Button onClick={refetchAllToday} icon={<Clock size={16} />}>
              Refresh
            </Button>
          }
        >
          <Table
            columns={todayAllColumns}
            dataSource={allTodayAttendance?.data || []}
            loading={isLoadingAllToday}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Total ${total} employees`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
        </Card>
      ) : (
        // Employee View - Show personal attendance
        <Card title="Attendance History">
          <div style={{ marginBottom: 16 }}>
            <DatePicker.RangePicker
              onChange={(dates) => setDateRange(dates)}
              format="DD MMM YYYY"
            />
          </div>
          <Table
            columns={personalColumns}
            dataSource={historyData?.data || []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} records`,
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default Attendance;
