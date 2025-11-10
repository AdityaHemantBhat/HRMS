import { apiSlice } from '../api/apiSlice';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query({
      query: () => '/dashboard/overview',
      providesTags: ['Dashboard'],
    }),
    getAttendanceAnalytics: builder.query({
      query: (params) => ({
        url: '/dashboard/attendance-analytics',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getLeaveAnalytics: builder.query({
      query: () => '/dashboard/leave-analytics',
      providesTags: ['Dashboard'],
    }),
    getPayrollAnalytics: builder.query({
      query: () => '/dashboard/payroll-analytics',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetAttendanceAnalyticsQuery,
  useGetLeaveAnalyticsQuery,
  useGetPayrollAnalyticsQuery,
} = dashboardApiSlice;
