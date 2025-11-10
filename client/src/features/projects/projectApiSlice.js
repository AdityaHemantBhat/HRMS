import { apiSlice } from '../api/apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all projects (Admin/HR/Team Lead)
    getAllProjects: builder.query({
      query: (params) => ({
        url: '/projects',
        params,
      }),
      providesTags: ['Projects'],
    }),

    // Get my assigned projects (Employee)
    getMyProjects: builder.query({
      query: (params) => ({
        url: '/projects/my-projects',
        params,
      }),
      providesTags: ['MyProjects'],
    }),

    // Get single project
    getProject: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),

    // Create project
    createProject: builder.mutation({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Projects', 'MyProjects'],
    }),

    // Update project
    updateProject: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Projects',
        'MyProjects',
        { type: 'Projects', id },
      ],
    }),

    // Delete project
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),

    // Assign employees to project
    assignEmployees: builder.mutation({
      query: ({ projectId, employeeIds, role }) => ({
        url: `/projects/${projectId}/assign`,
        method: 'POST',
        body: { employeeIds, role },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        'Projects',
        'MyProjects',
        { type: 'Projects', id: projectId },
      ],
    }),

    // Remove employee from project
    removeEmployee: builder.mutation({
      query: ({ projectId, assignmentId }) => ({
        url: `/projects/${projectId}/assign/${assignmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        'Projects',
        'MyProjects',
        { type: 'Projects', id: projectId },
      ],
    }),

    // Get tasks
    getTasks: builder.query({
      query: (params) => ({
        url: '/projects/tasks',
        params,
      }),
      providesTags: ['Tasks'],
    }),

    // Create task
    createTask: builder.mutation({
      query: (data) => ({
        url: '/projects/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tasks', 'Projects', 'MyProjects'],
    }),

    // Update task
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/projects/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Tasks', 'Projects', 'MyProjects'],
    }),

    // Log task time
    logTaskTime: builder.mutation({
      query: ({ taskId, ...data }) => ({
        url: `/projects/tasks/${taskId}/log`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tasks'],
    }),
  }),
});

export const {
  useGetAllProjectsQuery,
  useGetMyProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignEmployeesMutation,
  useRemoveEmployeeMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useLogTaskTimeMutation,
} = projectApiSlice;
