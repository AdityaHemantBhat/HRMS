import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, DatePicker, Select, message, Space, Tag, Tabs, Modal, Spin } from 'antd';
import { Download, FileSpreadsheet, Calendar, User, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetAllAttendanceQuery } from '../../features/attendance/attendanceApiSlice';

const { Option } = Select;
const { RangePicker } = DatePicker;

const DetailedAttendanceReport = () => {
  const [form] = Form.useForm();
  const [summaryData, setSummaryData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [queryParams, setQueryParams] = useState(null);
  
  const { data: attendanceData, isLoading, isError, error } = useGetAllAttendanceQuery(queryParams, {
    skip: !queryParams,
  });

  // Process attendance data when API returns results
  useEffect(() => {
    if (attendanceData && dateRange) {
      if (attendanceData.data && attendanceData.data.length > 0) {
        processAttendanceData(attendanceData.data);
      } else {
        // No data found for the selected period
        setSummaryData([]);
        message.warning('No attendance records found for the selected date range.');
      }
    }
  }, [attendanceData, dateRange]);
  
  const processAttendanceData = (data) => {
    // Group attendance records by employee
    const employeeMap = new Map();
    
    data.forEach(record => {
      const empId = record.employee.id;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          key: empId,
          employeeId: record.employee.employeeId,
          name: `${record.employee.firstName} ${record.employee.lastName}`,
          department: record.employee.department,
          designation: record.employee.designation,
          records: [],
        });
      }
      
      employeeMap.get(empId).records.push({
        key: `${empId}-${record.date}`,
        date: record.date,
        checkIn: record.checkIn ? dayjs(record.checkIn).format('hh:mm A') : 'N/A',
        checkOut: record.checkOut ? dayjs(record.checkOut).format('hh:mm A') : 'N/A',
        totalHours: record.totalHours ? parseFloat(record.totalHours).toFixed(2) : '0.00',
        status: record.status,
        breaks: record.breaks || [],
      });
    });
    
    // Generate summary data
    const summary = [];
    
    employeeMap.forEach((empData) => {
      const totalHours = empData.records.reduce((sum, r) => sum + parseFloat(r.totalHours), 0);
      
      summary.push({
        key: empData.key,
        employeeId: empData.employeeId,
        name: empData.name,
        department: empData.department,
        designation: empData.designation,
        totalHours: totalHours.toFixed(2),
        records: empData.records.sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date descending
      });
    });
    
    setSummaryData(summary);
    message.success('Report generated successfully!');
  };
  
  // Show error message if API call fails
  useEffect(() => {
    if (isError) {
      message.error(error?.data?.message || 'Failed to fetch attendance data. Please try again.');
    }
  }, [isError, error]);

  const handleGenerateReport = (values) => {
    const start = values.dateRange[0];
    const end = values.dateRange[1];
    
    setDateRange(values.dateRange);
    
    // Build query parameters with custom date range
    const params = {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      limit: 1000, // Get all records for the period
    };
    
    if (values.department) {
      params.department = values.department;
    }
    
    setQueryParams(params);
  };

  const handleViewDetails = (record) => {
    setSelectedEmployee(record);
  };

  const handleDownloadSummary = () => {
    if (!summaryData) return;
    
    const csvContent = [
      ['Employee ID', 'Name', 'Department', 'Designation', 'Total Hours'],
      ...summaryData.map(row => [
        row.employeeId,
        row.name,
        row.department,
        row.designation,
        row.totalHours,
      ])
    ].map(row => row.join(',')).join('\n');
    
    const startDate = dateRange[0].format('DD-MMM-YYYY');
    const endDate = dateRange[1].format('DD-MMM-YYYY');
    const filename = `Attendance-Summary-${startDate}-to-${endDate}.csv`;
    downloadCSV(csvContent, filename);
    message.success('Summary downloaded successfully!');
  };

  const handleDownloadDetailedReport = () => {
    if (!summaryData) return;
    
    // Create detailed CSV with all employees' daily records
    const csvRows = [
      ['Employee ID', 'Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status']
    ];
    
    summaryData.forEach(employee => {
      employee.records.forEach(record => {
        csvRows.push([
          employee.employeeId,
          employee.name,
          employee.department,
          dayjs(record.date).format('DD-MM-YYYY'),
          record.checkIn,
          record.checkOut,
          record.totalHours,
          record.status,
        ]);
      });
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    const startDate = dateRange[0].format('DD-MMM-YYYY');
    const endDate = dateRange[1].format('DD-MMM-YYYY');
    const filename = `Detailed-Attendance-Report-${startDate}-to-${endDate}.csv`;
    downloadCSV(csvContent, filename);
    message.success('Detailed report downloaded successfully!');
  };

  const handleDownloadEmployeeDetailed = (employee) => {
    if (!employee || !employee.records) return;
    
    const csvContent = [
      [`Attendance Report - ${employee.name} (${employee.employeeId})`],
      [`Department: ${employee.department}`],
      [`Designation: ${employee.designation}`],
      [`Period: ${dateRange[0].format('DD MMM YYYY')} - ${dateRange[1].format('DD MMM YYYY')}`],
      [`Total Hours: ${employee.totalHours} hrs`],
      [],
      ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status'],
      ...employee.records.map(row => [
        dayjs(row.date).format('DD-MM-YYYY'),
        row.checkIn,
        row.checkOut,
        row.totalHours,
        row.status,
      ])
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    
    const employeeName = employee.name.replace(/\s+/g, '-');
    const startDate = dateRange[0].format('DD-MMM-YYYY');
    const endDate = dateRange[1].format('DD-MMM-YYYY');
    const filename = `${employeeName}-${employee.employeeId}-${startDate}-to-${endDate}.csv`;
    downloadCSV(csvContent, filename);
    message.success(`Detailed report for ${employee.name} downloaded!`);
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const summaryColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 130,
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 120,
      render: (hours) => <strong style={{ color: '#1890ff' }}>{hours} hrs</strong>,
      sorter: (a, b) => parseFloat(a.totalHours) - parseFloat(b.totalHours),
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<User size={14} />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<Download size={14} />}
            onClick={() => handleDownloadEmployeeDetailed(record)}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  const detailColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (date) => <strong>{dayjs(date).format('DD MMM YYYY')}</strong>,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 120,
      render: (time) => (
        <Space>
          <Clock size={16} style={{ color: '#52c41a' }} />
          <span style={{ fontSize: '14px' }}>{time}</span>
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
          <Clock size={16} style={{ color: '#ff4d4f' }} />
          <span style={{ fontSize: '14px' }}>{time}</span>
        </Space>
      ),
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 110,
      render: (hours) => <strong style={{ color: '#1890ff', fontSize: '14px' }}>{hours} hrs</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        let color = 'default';
        let text = status;
        
        if (status === 'PRESENT') {
          color = 'green';
          text = 'On Time';
        } else if (status === 'LATE') {
          color = 'orange';
          text = 'Late';
        } else if (status === 'ABSENT') {
          color = 'red';
          text = 'Absent';
        }
        
        return <Tag color={color} style={{ fontSize: '13px', padding: '2px 8px' }}>{text}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Detailed Attendance Reports</h1>
          <p>Generate comprehensive attendance reports with daily breakdown</p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleGenerateReport}
        >
          <Form.Item
            name="dateRange"
            rules={[{ required: true, message: 'Select date range!' }]}
          >
            <RangePicker
              format="DD MMM YYYY"
              style={{ width: 300 }}
              placeholder={['Start Date', 'End Date']}
            />
          </Form.Item>

          <Form.Item
            name="department"
          >
            <Select placeholder="All Departments" style={{ width: 180 }} allowClear>
              <Option value="Engineering">Engineering</Option>
              <Option value="HR">HR</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Finance">Finance</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<Calendar size={16} />}>
              Generate Report
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {isLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <h3 style={{ color: '#8c8c8c', marginTop: '16px' }}>Loading Attendance Data...</h3>
          </div>
        </Card>
      )}

      {!isLoading && summaryData && summaryData.length > 0 && dateRange && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Attendance Report: {dateRange[0].format('DD MMM YYYY')} - {dateRange[1].format('DD MMM YYYY')}
              </span>
              <Space>
                <Button
                  icon={<Download size={16} />}
                  onClick={handleDownloadSummary}
                >
                  Download Summary
                </Button>
                <Button
                  type="primary"
                  icon={<Download size={16} />}
                  onClick={handleDownloadDetailedReport}
                >
                  Download Detailed Report
                </Button>
              </Space>
            </div>
          }
        >
          <Table
            columns={summaryColumns}
            dataSource={summaryData}
            rowKey="key"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} employees`,
            }}
          />
        </Card>
      )}

      {!isLoading && summaryData && summaryData.length === 0 && dateRange && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileSpreadsheet size={64} style={{ color: '#faad14', marginBottom: '16px' }} />
            <h3 style={{ color: '#8c8c8c' }}>No Attendance Records Found</h3>
            <p style={{ color: '#bfbfbf' }}>
              No attendance data available for the selected date range: {dateRange[0].format('DD MMM YYYY')} - {dateRange[1].format('DD MMM YYYY')}
              <br />
              Please try a different date range or check if employees have checked in during this period.
            </p>
          </div>
        </Card>
      )}

      {!isLoading && !summaryData && !queryParams && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileSpreadsheet size={64} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
            <h3 style={{ color: '#8c8c8c' }}>No Report Generated</h3>
            <p style={{ color: '#bfbfbf' }}>Select date range and click "Generate Report" to view attendance data</p>
          </div>
        </Card>
      )}

      {/* Employee Detail Modal */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            <User size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Detailed Attendance - {selectedEmployee?.name}
          </div>
        }
        open={!!selectedEmployee}
        onCancel={() => setSelectedEmployee(null)}
        width={1000}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<Download size={16} />}
            onClick={() => {
              handleDownloadEmployeeDetailed(selectedEmployee);
            }}
          >
            Download Report
          </Button>,
          <Button key="close" onClick={() => setSelectedEmployee(null)}>
            Close
          </Button>,
        ]}
      >
        {selectedEmployee && (
          <>
            <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <Space size="large" wrap>
                <div>
                  <strong>Employee ID:</strong> {selectedEmployee.employeeId}
                </div>
                <div>
                  <strong>Department:</strong> {selectedEmployee.department}
                </div>
                <div>
                  <strong>Designation:</strong> {selectedEmployee.designation}
                </div>
                <div>
                  <strong>Total Hours:</strong> {selectedEmployee.totalHours} hrs
                </div>
                <div>
                  <strong>Period:</strong> {dateRange[0].format('DD MMM YYYY')} - {dateRange[1].format('DD MMM YYYY')}
                </div>
              </Space>
            </div>
            <Table
              columns={detailColumns}
              dataSource={selectedEmployee.records}
              rowKey="key"
              pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '30'] }}
              size="middle"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default DetailedAttendanceReport;
