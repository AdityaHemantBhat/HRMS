import React, { useState } from 'react';
import { Card, Button, List, Progress, Tag, Modal, Form, Input, DatePicker, Select, Spin, Slider, Space, Tooltip, Popconfirm } from 'antd';
import { message } from '../../utils/notification';
import { Plus, Target, Edit, Trash2, CheckCircle } from 'lucide-react';
import dayjs from 'dayjs';
import {
  useGetMyGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} from '../../features/goals/goalApiSlice';
import { useGetMyProjectsQuery } from '../../features/projects/projectApiSlice';

const { TextArea } = Input;

const Performance = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: goalsData, isLoading, refetch } = useGetMyGoalsQuery();
  const { data: projectsData } = useGetMyProjectsQuery();
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation();
  const [updateGoal, { isLoading: isUpdating }] = useUpdateGoalMutation();
  const [deleteGoal] = useDeleteGoalMutation();

  const goals = goalsData?.data || [];
  const projects = projectsData?.data || [];

  const handleAddGoal = async (values) => {
    try {
      const goalData = {
        title: values.title,
        description: values.description,
        targetDate: values.deadline.format('YYYY-MM-DD'),
      };
      
      // Add projectId if selected
      if (values.projectId) {
        goalData.projectId = values.projectId;
      }
      
      await createGoal(goalData).unwrap();
      message.success('Goal created successfully!');
      setIsModalOpen(false);
      form.resetFields();
      refetch();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to create goal');
    }
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    editForm.setFieldsValue({
      title: goal.title,
      description: goal.description,
      targetDate: dayjs(goal.targetDate),
      progress: goal.progress,
      status: goal.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = async (values) => {
    try {
      await updateGoal({
        id: selectedGoal.id,
        title: values.title,
        description: values.description,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        progress: values.progress,
        status: values.status,
      }).unwrap();
      message.success('Goal updated successfully!');
      setIsEditModalOpen(false);
      setSelectedGoal(null);
      editForm.resetFields();
      refetch();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoal(goalId).unwrap();
      message.success('Goal deleted successfully!');
      refetch();
    } catch (error) {
      message.error('Failed to delete goal');
    }
  };

  const handleMarkComplete = async (goal) => {
    try {
      await updateGoal({
        id: goal.id,
        status: 'COMPLETED',
        progress: 100,
      }).unwrap();
      message.success('Goal marked as completed!');
      refetch();
    } catch (error) {
      message.error('Failed to update goal');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'IN_PROGRESS': 'blue',
      'COMPLETED': 'green',
      'CANCELLED': 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Performance & Goals</h1>
          <p>Track your goals and performance metrics</p>
        </div>
        <Button type="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          New Goal
        </Button>
      </div>

      <Card title="My Goals">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#8c8c8c' }}>Loading goals...</p>
          </div>
        ) : (
          <List
            dataSource={goals}
            renderItem={(goal) => (
              <List.Item
                actions={[
                  goal.status !== 'COMPLETED' && (
                    <Tooltip title="Mark Complete">
                      <Button
                        type="link"
                        icon={<CheckCircle size={16} />}
                        style={{ color: '#52c41a' }}
                        onClick={() => handleMarkComplete(goal)}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="Edit">
                    <Button
                      type="link"
                      icon={<Edit size={16} />}
                      onClick={() => handleEditGoal(goal)}
                    />
                  </Tooltip>,
                  <Popconfirm
                    title="Delete Goal"
                    description="Are you sure you want to delete this goal?"
                    onConfirm={() => handleDeleteGoal(goal.id)}
                    okText="Delete"
                    okType="danger"
                  >
                    <Button
                      type="link"
                      danger
                      icon={<Trash2 size={16} />}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Target size={24} style={{ color: '#6366f1' }} />}
                  title={
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>{goal.title}</span>
                      {goal.project && (
                        <Tag color="purple" style={{ marginLeft: 8 }}>
                          📁 {goal.project.name}
                        </Tag>
                      )}
                    </div>
                  }
                  description={goal.description}
                />
                <div style={{ minWidth: 250 }}>
                  <Progress percent={goal.progress} strokeColor="#6366f1" />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</Tag>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      Due: {dayjs(goal.targetDate).format('DD MMM YYYY')}
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Target size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
                  <p style={{ color: '#8c8c8c' }}>No goals yet. Create your first goal!</p>
                </div>
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title="Create New Goal"
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
          onFinish={handleAddGoal}
        >
          <Form.Item
            label="Goal Title"
            name="title"
            rules={[{ required: true, message: 'Please enter goal title!' }]}
          >
            <Input placeholder="e.g., Complete React Certification" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <TextArea rows={4} placeholder="Describe your goal..." />
          </Form.Item>

          <Form.Item
            label="Link to Project (Optional)"
            name="projectId"
            tooltip="Link this goal to a project. If not selected, system will try to auto-match based on name."
          >
            <Select
              placeholder="Select a project (optional)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {projects.map((assignment) => (
                <Select.Option key={assignment.project.id} value={assignment.project.id}>
                  {assignment.project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Target Date"
            name="deadline"
            rules={[{ required: true, message: 'Please select target date!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<Target size={16} />} loading={isCreating}>
                Create Goal
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

      {/* Edit Goal Modal */}
      <Modal
        title="Edit Goal"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedGoal(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateGoal}
        >
          <Form.Item
            label="Goal Title"
            name="title"
            rules={[{ required: true, message: 'Please enter goal title!' }]}
          >
            <Input placeholder="e.g., Complete React Certification" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description!' }]}
          >
            <TextArea rows={4} placeholder="Describe your goal..." />
          </Form.Item>

          <Form.Item
            label="Target Date"
            name="targetDate"
            rules={[{ required: true, message: 'Please select target date!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Progress (%)"
            name="progress"
            rules={[{ required: true }]}
          >
            <Slider
              min={0}
              max={100}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
              <Select.Option value="COMPLETED">Completed</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Update Goal
              </Button>
              <Button onClick={() => {
                setIsEditModalOpen(false);
                setSelectedGoal(null);
                editForm.resetFields();
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

export default Performance;
