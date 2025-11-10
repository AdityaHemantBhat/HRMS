import React, { useState } from 'react';
import { Card, Table, Button, Form, DatePicker, Select, message, Space, Tag, Tabs } from 'antd';
import { Download, FileSpreadsheet, Calendar, User } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetAttendanceStatsQuery } from '../../features/attendance/attendanceApiSlice';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const AttendanceReport = () => {
  const [form] = Form.useForm();
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const handleGenerateReport = (values) => {
    // Mock data - replace with actual API call
    const mockData = [
      {
        id: 1,
        employeeId: 'EMP001',
        name: 'John Doe',
        department: 'Engineering',
        presentDays: 22,
        absentDays: 2,
        lateDays: 3,
        totalHours: 176,
      },
      {
        id: 2,
        employeeId: 'EMP002',
        name: 'Jane Smith',
        department: 'HR',
        presentDays: 24,
        absentDays: 0,
        lateDays: 1,
        totalHours: 192,
      },
    ];
    setReportData(mockData);
    setDateRange(values.dateRange);
    message.success('Report generated successfully!');
  };

  const handleDownloadExcel = () => {
    // This would normally call an API endpoint to generate Excel
    message.success('Downloading attendance report...');
    
    // Mock download
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = (data) => {
    const headers = ['Employee ID', 'Name', 'Department', 'Present Days', 'Absent Days', 'Late Days', 'Total Hours'];
    const rows = data.map(row => [
      row.employeeId,
      row.name,
      row.department,
      row.presentDays,
      row.absentDays,
      row.lateDays,
      row.totalHours,
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Present Days',
      dataIndex: 'presentDays',
      key: 'presentDays',
      render: (days) => <Tag color="green">{days}</Tag>,
    },
    {
      title: 'Absent Days',
      dataIndex: 'absentDays',
      key: 'absentDays',
      render: (days) => <Tag color={days > 0 ? 'red' : 'default'}>{days}</Tag>,
    },
    {
      title: 'Late Days',
      dataIndex: 'lateDays',
      key: 'lateDays',
      render: (days) => <Tag color={days > 0 ? 'orange' : 'default'}>{days}</Tag>,
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => `${hours} hrs`,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attendance Reports</h1>
          <p>Generate and download attendance reports</p>
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

      {reportData && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Attendance Report: {dateRange[0].format('DD MMM YYYY')} - {dateRange[1].format('DD MMM YYYY')}
              </span>
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={handleDownloadExcel}
              >
                Download Excel
              </Button>
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={reportData}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} employees`,
            }}
          />
        </Card>
      )}

      {!reportData && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileSpreadsheet size={64} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
            <h3 style={{ color: '#8c8c8c' }}>No Report Generated</h3>
            <p style={{ color: '#bfbfbf' }}>Select date range and click "Generate Report" to view attendance data</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendanceReport;
