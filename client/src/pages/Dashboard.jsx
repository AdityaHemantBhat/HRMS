import React from 'react';
import { Card, Row, Col, Statistic, Button, Spin, Space, Tooltip, Alert, message, Table, Tag } from 'antd';
import { Users, Clock, Calendar, CheckCircle, Coffee, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useGetDashboardOverviewQuery, useGetAttendanceAnalyticsQuery } from '../features/dashboard/dashboardApiSlice';
import { 
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation
} from '../features/attendance/attendanceApiSlice';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import '../styles/dashboard.scss';

dayjs.extend(weekday);

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardOverviewQuery();
  const { data: attendanceAnalytics } = useGetAttendanceAnalyticsQuery();
  const { data: todayData, refetch: refetchToday } = useGetTodayAttendanceQuery();
  
  // Get current week's attendance for employee
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();
  const { data: myAttendanceData } = useGetMyAttendanceQuery({
    month: currentMonth,
    year: currentYear
  });
  
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

  if (isDashboardLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '16px' }}>
        <Spin size="large" />
        <div style={{ color: '#666', fontSize: '14px' }}>Loading dashboard...</div>
      </div>
    );
  }

  const stats = dashboardData?.data || {};
  
  // Generate attendance data for current week (Monday to Sunday)
  const getWeekAttendanceData = () => {
    const dailyData = attendanceAnalytics?.data?.dailyAttendance || [];
    const today = dayjs();
    const startOfWeek = today.startOf('week'); // Sunday
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return weekDays.map((day, index) => {
      const date = startOfWeek.add(index, 'day');
      const dayData = dailyData.find(d => 
        dayjs(d.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
      );
      return {
        day,
        present: dayData?._count || 0,
        date: date.format('DD MMM')
      };
    });
  };

  const attendanceData = getWeekAttendanceData();

  // Get recent activities from backend data
  const getRecentActivities = () => {
    const activities = [];
    
    // Add recent hires
    if (stats.recentHires && stats.recentHires.length > 0) {
      stats.recentHires.slice(0, 2).forEach((hire, index) => {
        const joinDate = dayjs(hire.joiningDate);
        const daysAgo = dayjs().diff(joinDate, 'day');
        const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
        
        activities.push({
          id: `hire-${index}`,
          type: 'employee',
          user: `${hire.firstName} ${hire.lastName}`,
          action: 'Joined the company',
          time: timeText
        });
      });
    }
    
    // Add attendance info
    if (stats.attendance?.today > 0) {
      activities.push({
        id: 'attendance-today',
        type: 'attendance',
        user: `${stats.attendance.today} employees`,
        action: 'Marked attendance today',
        time: 'Today'
      });
    }
    
    // Add pending leaves info
    if (stats.leaves?.pending > 0) {
      activities.push({
        id: 'leaves-pending',
        type: 'leave',
        user: `${stats.leaves.pending} leave requests`,
        action: 'Pending approval',
        time: 'Awaiting action'
      });
    }
    
    return activities.length > 0 ? activities : [
      { id: 1, type: 'info', user: 'System', action: 'No recent activities', time: 'Today' }
    ];
  };

  const recentActivities = getRecentActivities();

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.employee?.firstName}!</p>
      </div>

      {isAdmin ? (
        <>
          {/* Admin Dashboard */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Total Employees"
                  value={stats.employees?.total || 0}
                  prefix={<Users size={24} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Present Today"
                  value={stats.attendance?.today || 0}
                  prefix={<CheckCircle size={24} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Pending Leaves"
                  value={stats.leaves?.pending || 0}
                  prefix={<Calendar size={24} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Monthly Payroll"
                  value={stats.payroll?.monthlyTotal || 0}
                  prefix="₹"
                  valueStyle={{ color: '#722ed1' }}
                  precision={0}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card title="Attendance Overview (This Week)" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{
                              backgroundColor: 'white',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.date}</p>
                              <p style={{ margin: '4px 0 0 0', color: '#1890ff' }}>
                                Present: {payload[0].value} employees
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="present" fill="#1890ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Recent Activities" className="activity-card">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-content">
                      <strong>{activity.user}</strong>
                      <p>{activity.action}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <>
          {/* Employee Dashboard */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Today's Attendance" className="attendance-card">
                {!todayAttendance?.checkIn && (
                  <Alert
                    message="You haven't checked in today"
                    description="Please check in to start tracking your attendance. Breaks will be available after check-in."
                    type="info"
                    icon={<AlertCircle size={16} />}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Space size="middle" wrap style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<Clock />}
                        onClick={handleCheckIn}
                        loading={isCheckingIn}
                        disabled={todayAttendance?.checkIn}
                      >
                        Check In
                      </Button>
                      <Tooltip 
                        title={!todayAttendance?.checkIn ? "Please check in first" : todayAttendance?.checkOut ? "Already checked out" : ""}
                      >
                        <span>
                          <Button
                            size="large"
                            icon={<Clock />}
                            onClick={handleCheckOut}
                            loading={isCheckingOut}
                            disabled={!todayAttendance?.checkIn || todayAttendance?.checkOut}
                            danger={!todayAttendance?.checkIn}
                          >
                            Check Out
                          </Button>
                        </span>
                      </Tooltip>
                      {ongoingBreak ? (
                        <Button
                          size="large"
                          icon={<Coffee />}
                          onClick={handleEndBreak}
                          loading={isEndingBreak}
                          danger
                        >
                          End Break
                        </Button>
                      ) : (
                        <>
                          <Tooltip title={!todayAttendance?.checkIn ? "Please check in first" : todayAttendance?.checkOut ? "Already checked out" : ""}>
                            <span>
                              <Button
                                size="large"
                                icon={<Coffee />}
                                onClick={() => handleStartBreak('TEA')}
                                loading={isStartingBreak}
                                disabled={!todayAttendance?.checkIn || todayAttendance?.checkOut}
                              >
                                Tea Break
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip title={!todayAttendance?.checkIn ? "Please check in first" : todayAttendance?.checkOut ? "Already checked out" : ""}>
                            <span>
                              <Button
                                size="large"
                                icon={<Coffee />}
                                onClick={() => handleStartBreak('LUNCH')}
                                loading={isStartingBreak}
                                disabled={!todayAttendance?.checkIn || todayAttendance?.checkOut}
                              >
                                Lunch Break
                              </Button>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </Space>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    {todayAttendance && (
                      <Space size="large" wrap>
                        <Statistic
                          title="Check In"
                          value={todayAttendance.checkIn ? dayjs(todayAttendance.checkIn).format('hh:mm A') : '-'}
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <Statistic
                          title="Check Out"
                          value={todayAttendance.checkOut ? dayjs(todayAttendance.checkOut).format('hh:mm A') : '-'}
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <Statistic
                          title="Hours"
                          value={todayAttendance.totalHours || '0'}
                          suffix="hrs"
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <Statistic
                          title="Status"
                          value={todayAttendance.status}
                          valueStyle={{ 
                            fontSize: '16px',
                            color: todayAttendance.status === 'LATE' ? '#ff4d4f' : '#52c41a' 
                          }}
                        />
                      </Space>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Weekly Attendance Overview */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title="My Weekly Attendance (This Week)" className="weekly-attendance-card">
                {(() => {
                  // Get current week's data (Monday to Sunday)
                  const today = dayjs();
                  const startOfWeek = today.startOf('week'); // Sunday
                  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  
                  // Calculate weekly stats
                  const thisWeekAttendance = myAttendanceData?.data?.filter(a => {
                    const attDate = dayjs(a.date);
                    return attDate.isAfter(startOfWeek.subtract(1, 'day')) && 
                           attDate.isBefore(startOfWeek.add(7, 'day'));
                  }) || [];
                  
                  const presentDays = thisWeekAttendance.filter(a => 
                    ['PRESENT', 'LATE', 'WFH'].includes(a.status)
                  ).length;
                  const totalHours = thisWeekAttendance.reduce((sum, a) => 
                    sum + (parseFloat(a.totalHours) || 0), 0
                  ).toFixed(1);
                  const avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(1) : '0';
                  
                  const weekData = weekDays.map((dayName, index) => {
                    const date = startOfWeek.add(index, 'day');
                    const dateStr = date.format('YYYY-MM-DD');
                    const isFutureDate = date.isAfter(today, 'day');
                    
                    // Find attendance for this date
                    const attendance = myAttendanceData?.data?.find(a => 
                      dayjs(a.date).format('YYYY-MM-DD') === dateStr
                    );
                    
                    // Determine status: only show actual attendance data
                    let status = null;
                    if (attendance) {
                      // If attendance record exists, use its status
                      status = attendance.status;
                    }
                    // Don't automatically mark as ABSENT - let backend determine this
                    
                    return {
                      key: dateStr,
                      day: dayName,
                      date: date.format('DD MMM'),
                      checkIn: attendance?.checkIn ? dayjs(attendance.checkIn).format('hh:mm A') : '-',
                      checkOut: attendance?.checkOut ? dayjs(attendance.checkOut).format('hh:mm A') : '-',
                      hours: attendance?.totalHours || '-',
                      status: status,
                      isToday: date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD'),
                      isFuture: isFutureDate
                    };
                  });

                  const columns = [
                    {
                      title: 'Day',
                      dataIndex: 'day',
                      key: 'day',
                      width: 80,
                      render: (text, record) => (
                        <span style={{ fontWeight: record.isToday ? 'bold' : 'normal' }}>
                          {text}
                          {record.isToday && <Tag color="blue" style={{ marginLeft: 8 }}>Today</Tag>}
                        </span>
                      )
                    },
                    {
                      title: 'Date',
                      dataIndex: 'date',
                      key: 'date',
                      width: 100,
                    },
                    {
                      title: 'Check In',
                      dataIndex: 'checkIn',
                      key: 'checkIn',
                      width: 120,
                      render: (text) => <span style={{ color: text === '-' ? '#999' : '#52c41a' }}>{text}</span>
                    },
                    {
                      title: 'Check Out',
                      dataIndex: 'checkOut',
                      key: 'checkOut',
                      width: 120,
                      render: (text) => <span style={{ color: text === '-' ? '#999' : '#ff4d4f' }}>{text}</span>
                    },
                    {
                      title: 'Hours',
                      dataIndex: 'hours',
                      key: 'hours',
                      width: 80,
                      render: (hours) => hours !== '-' ? `${hours} hrs` : '-'
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status, record) => {
                        if (!status) {
                          // No attendance record
                          if (record.isFuture) {
                            return <span style={{ color: '#999', fontSize: '13px' }}>-</span>;
                          } else if (record.isToday) {
                            return <Tag color="default">Not Marked</Tag>;
                          }
                          // Past dates with no data
                          return <span style={{ color: '#999', fontSize: '13px' }}>-</span>;
                        }
                        
                        const colorMap = {
                          PRESENT: 'green',
                          LATE: 'orange',
                          ABSENT: 'red',
                          HALF_DAY: 'blue',
                          WFH: 'purple',
                        };
                        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
                      }
                    },
                  ];

                  return (
                    <>
                      {/* Weekly Summary Stats */}
                      <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Days Present"
                            value={presentDays}
                            suffix="/ 7"
                            valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Total Hours"
                            value={totalHours}
                            suffix="hrs"
                            valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Avg Hours/Day"
                            value={avgHours}
                            suffix="hrs"
                            valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Attendance Rate"
                            value={presentDays > 0 ? Math.round((presentDays / 7) * 100) : 0}
                            suffix="%"
                            valueStyle={{ 
                              color: presentDays >= 5 ? '#52c41a' : presentDays >= 3 ? '#faad14' : '#ff4d4f',
                              fontSize: '20px'
                            }}
                          />
                        </Col>
                      </Row>

                      {/* Weekly Attendance Table */}
                      <Table
                        columns={columns}
                        dataSource={weekData}
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                      />
                    </>
                  );
                })()}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
