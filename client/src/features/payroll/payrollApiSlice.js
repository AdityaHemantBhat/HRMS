import { apiSlice } from '../api/apiSlice';

export const payrollApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayrolls: builder.query({
      query: (params) => ({
        url: '/payroll',
        params,
      }),
      providesTags: ['Payroll'],
    }),
    getPayroll: builder.query({
      query: (id) => `/payroll/${id}`,
      providesTags: ['Payroll'],
    }),
    generatePayroll: builder.mutation({
      query: (data) => ({
        url: '/payroll/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payroll'],
    }),
    finalizePayroll: builder.mutation({
      query: (id) => ({
        url: `/payroll/${id}/finalize`,
        method: 'PUT',
      }),
      invalidatesTags: ['Payroll'],
    }),
    getPayrollStats: builder.query({
      query: (params) => ({
        url: '/payroll/stats/overview',
        params,
      }),
      providesTags: ['Payroll'],
    }),
  }),
});

export const {
  useGetPayrollsQuery,
  useGetPayrollQuery,
  useGeneratePayrollMutation,
  useFinalizePayrollMutation,
  useGetPayrollStatsQuery,
} = payrollApiSlice;
