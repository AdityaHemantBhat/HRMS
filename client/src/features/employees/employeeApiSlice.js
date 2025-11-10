import { apiSlice } from '../api/apiSlice';

export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => ({
        url: '/employees',
        params,
      }),
      providesTags: ['Employee'],
    }),
    getEmployee: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: ['Employee'],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: '/employees',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Employee'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employee'],
    }),
    getEmployeeStats: builder.query({
      query: () => '/employees/stats/overview',
      providesTags: ['Employee'],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeStatsQuery,
} = employeeApiSlice;
