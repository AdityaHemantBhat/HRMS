import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Switch, Space, Tag, Select } from 'antd';
import { message } from '../../utils/notification';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetHolidaysQuery, useCreateHolidayMutation } from '../../features/leaves/leaveApiSlice';

const { Option } = Select;

const HolidayManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [form] = Form.useForm();

  const { data: holidaysData, isLoading } = useGetHolidaysQuery({ year: selectedYear });
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();

  const handleSubmit = async (values) => {
    try {
      await createHoliday({
        name: values.name,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        isOptional: values.isOptional || false,
      }).unwrap();
      message.success('Holiday added successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to add holiday');
    }
  };

  const columns = [
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} />
            {text}
          </div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <div>
          <div style={{ fontWeight: 500 }}>{dayjs(date).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {dayjs(date).format('dddd')}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Type',
      dataIndex: 'isOptional',
      key: 'isOptional',
      render: (isOptional) => (
        <Tag color={isOptional ? 'orange' : 'green'}>
          {isOptional ? 'Optional' : 'Mandatory'}
        </Tag>
      ),
    },
    {
      title: 'Days Until',
      key: 'daysUntil',
      render: (_, record) => {
        const days = dayjs(record.date).diff(dayjs(), 'day');
        if (days < 0) return <Tag color="default">Past</Tag>;
        if (days === 0) return <Tag color="blue">Today</Tag>;
        if (days <= 7) return <Tag color="orange">{days} days</Tag>;
        return <Tag color="green">{days} days</Tag>;
      },
    },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Holiday Management</h1>
          <p>Manage company holidays and optional holidays</p>
        </div>
        <Space>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ width: 120 }}
          >
            {years.map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => {
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Add Holiday
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={holidaysData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} holidays`,
          }}
        />
      </Card>

      <Modal
        title="Add Holiday"
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
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Holiday Name"
            name="name"
            rules={[{ required: true, message: 'Please enter holiday name!' }]}
          >
            <Input placeholder="e.g., Independence Day" />
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select date!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Brief description of the holiday" />
          </Form.Item>

          <Form.Item
            label="Optional Holiday"
            name="isOptional"
            valuePropName="checked"
            initialValue={false}
            extra="Optional holidays can be taken at employee's discretion"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Add Holiday
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

export default HolidayManagement;
