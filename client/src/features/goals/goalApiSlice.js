import { apiSlice } from '../api/apiSlice';

export const goalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get my goals
    getMyGoals: builder.query({
      query: (params) => ({
        url: '/goals',
        params,
      }),
      providesTags: ['Goals'],
    }),

    // Get all goals (Admin/HR/Team Lead)
    getAllGoals: builder.query({
      query: (params) => ({
        url: '/goals/all',
        params,
      }),
      providesTags: ['Goals'],
    }),

    // Get single goal
    getGoal: builder.query({
      query: (id) => `/goals/${id}`,
      providesTags: (result, error, id) => [{ type: 'Goals', id }],
    }),

    // Create goal
    createGoal: builder.mutation({
      query: (data) => ({
        url: '/goals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Goals', 'Projects'],
    }),

    // Update goal
    updateGoal: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/goals/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ['Goals', { type: 'Goals', id }, 'Projects'],
    }),

    // Delete goal
    deleteGoal: builder.mutation({
      query: (id) => ({
        url: `/goals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Goals', 'Projects'],
    }),
  }),
});

export const {
  useGetMyGoalsQuery,
  useGetAllGoalsQuery,
  useGetGoalQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} = goalApiSlice;
