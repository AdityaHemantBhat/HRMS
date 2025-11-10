import React, { useState } from 'react';
import { Card, Table, Button, Tag, Progress, Space, Modal, Form, Input, DatePicker, Select, message, Spin, Tooltip, Descriptions, List } from 'antd';
import { Plus, Eye, Edit, Trash2, Users, CheckCircle, Target } from 'lucide-react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetAllProjectsQuery,
  useGetMyProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignEmployeesMutation,
} from '../../features/projects/projectApiSlice';
import { useGetEmployeesQuery } from '../../features/employees/employeeApiSlice';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ProjectList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form] = Form.useForm();
  
  const user = useSelector(selectCurrentUser);
  const isManager = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD';

  // Fetch data based on role
  const { data: allProjectsData, isLoading: isLoadingAll, refetch: refetchAll } = useGetAllProjectsQuery(
    {},
    { skip: !isManager }
  );
  const { data: myProjectsData, isLoading: isLoadingMy, refetch: refetchMy } = useGetMyProjectsQuery(
    {},
    { skip: isManager }
  );
  const { data: employeesData } = useGetEmployeesQuery({ limit: 1000 });

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [assignEmployees] = useAssignEmployeesMutation();

  const projects = isManager ? allProjectsData?.data : myProjectsData?.data;
  const isLoading = isManager ? isLoadingAll : isLoadingMy;

  const handleCreateProject = async (values) => {
    try {
      const projectData = {
        name: values.name,
        description: values.description,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        priority: values.priority,
        status: 'PLANNING',
        employeeIds: values.employeeIds || [],
      };

      await createProject(projectData).unwrap();
      message.success('Project created and employees assigned successfully!');
      setIsModalOpen(false);
      form.resetFields();
      if (isManager) {
        refetchAll();
      } else {
        refetchMy();
      }
    } catch (error) {
      message.error(error?.data?.message || 'Failed to create project');
    }
  };

  const handleMarkComplete = async (projectId) => {
    try {
      await updateProject({
        id: projectId,
        status: 'COMPLETED',
      }).unwrap();
      message.success('Project marked as completed!');
    } catch (error) {
      message.error('Failed to mark project as completed');
    }
  };

  const handleDeleteProject = async (projectId) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(projectId).unwrap();
          message.success('Project deleted successfully');
        } catch (error) {
          message.error('Failed to delete project');
        }
      },
    });
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  // Get progress from API response (calculated from goals or tasks)
  const calculateProgress = (project) => {
    if (isManager) {
      // For managers viewing all projects - progress is calculated on backend
      return project.progress || 0;
    } else {
      // For employees viewing their assigned projects
      return project.project?.progress || 0;
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const projectData = isManager ? record : record.project;
        return (
          <div>
            <strong>{projectData.name}</strong>
            {!isManager && record.role && (
              <Tag color="blue" style={{ marginLeft: 8 }}>{record.role}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => {
        const projectData = isManager ? record : record.project;
        return projectData.description || '-';
      },
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 200,
      render: (_, record) => {
        const projectData = isManager ? record : record.project;
        return (
          <div>
            <div>{dayjs(projectData.startDate).format('DD MMM YYYY')}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              to {dayjs(projectData.endDate).format('DD MMM YYYY')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Team',
      key: 'team',
      width: 100,
      render: (_, record) => {
        const projectData = isManager ? record : record.project;
        const teamSize = projectData._count?.assignments || projectData.assignments?.length || 0;
        return (
          <Space>
            <Users size={16} />
            <span>{teamSize}</span>
          </Space>
        );
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const projectData = isManager ? record : record.project;
        const progress = calculateProgress(record);
        return <Progress percent={progress} size="small" />;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const projectData = isManager ? record : record.project;
        const colorMap = {
          PLANNING: 'blue',
          IN_PROGRESS: 'orange',
          ON_HOLD: 'red',
          COMPLETED: 'green',
        };
        return <Tag color={colorMap[projectData.status]}>{projectData.status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: isManager ? 200 : 100,
      render: (_, record) => {
        const projectData = isManager ? record : record.project;
        return (
          <Space>
            <Tooltip title="View Details">
              <Button
                type="link"
                size="small"
                icon={<Eye size={16} />}
                onClick={() => handleViewProject(record)}
              />
            </Tooltip>
            {isManager && (
              <>
                {projectData.status !== 'COMPLETED' && (
                  <Tooltip title="Mark Complete">
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckCircle size={16} />}
                      style={{ color: '#52c41a' }}
                      onClick={() => handleMarkComplete(projectData.id)}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDeleteProject(projectData.id)}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>{isManager ? 'Manage and track all projects' : 'View your assigned projects'}</p>
        </div>
        {isManager && (
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            New Project
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#8c8c8c' }}>Loading projects...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={projects || []}
            rowKey={(record) => isManager ? record.id : record.id}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} projects`,
            }}
          />
        )}
      </Card>

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={4} placeholder="Enter project description" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Project Duration"
            rules={[{ required: true, message: 'Please select project duration' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="MEDIUM"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="LOW">Low</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="CRITICAL">Critical</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="employeeIds"
            label="Assign Employees"
            tooltip="Select one or more employees to assign to this project"
          >
            <Select
              mode="multiple"
              placeholder="Select employees to assign"
              showSearch
              filterOption={(input, option) => {
                const searchText = `${option.firstname} ${option.lastname} ${option.employeeid} ${option.designation}`.toLowerCase();
                return searchText.includes(input.toLowerCase());
              }}
              options={employeesData?.data?.map((employee) => ({
                value: employee.id,
                label: `${employee.firstName} ${employee.lastName} (${employee.employeeId}) - ${employee.designation}`,
                firstname: employee.firstName,
                lastname: employee.lastName,
                employeeid: employee.employeeId,
                designation: employee.designation,
              })) || []}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Create Project
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

      {/* View Project Modal */}
      <Modal
        title="Project Details"
        open={isViewModalOpen}
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedProject(null);
        }}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <div>
            {(() => {
              const projectData = isManager ? selectedProject : selectedProject.project;
              return (
                <>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Project Name" span={2}>
                      <strong>{projectData.name}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {projectData.description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Start Date">
                      {dayjs(projectData.startDate).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                      {dayjs(projectData.endDate).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={projectData.status === 'COMPLETED' ? 'green' : 'blue'}>
                        {projectData.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Progress">
                      <Progress percent={calculateProgress(selectedProject)} />
                    </Descriptions.Item>
                  </Descriptions>

                  {projectData.assignments && projectData.assignments.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h3>Assigned Team Members</h3>
                      <List
                        dataSource={projectData.assignments}
                        renderItem={(assignment) => (
                          <List.Item>
                            <List.Item.Meta
                              title={`${assignment.employee.firstName} ${assignment.employee.lastName}`}
                              description={`${assignment.employee.employeeId} - ${assignment.employee.designation}`}
                            />
                            <Tag color="blue">{assignment.role}</Tag>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectList;
