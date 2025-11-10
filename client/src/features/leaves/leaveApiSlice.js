import { apiSlice } from '../api/apiSlice';

export const leaveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params) => ({
        url: '/leaves',
        params,
      }),
      providesTags: ['Leave'],
    }),
    getLeave: builder.query({
      query: (id) => `/leaves/${id}`,
      providesTags: ['Leave'],
    }),
    applyLeave: builder.mutation({
      query: (data) => ({
        url: '/leaves',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Leave'],
    }),
    approveLeave: builder.mutation({
      query: (id) => ({
        url: `/leaves/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['Leave'],
    }),
    rejectLeave: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/leaves/${id}/reject`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Leave'],
    }),
    getLeaveBalance: builder.query({
      query: () => '/leaves/balance',
      providesTags: ['Leave'],
    }),
    getHolidays: builder.query({
      query: (params) => ({
        url: '/leaves/holidays',
        params,
      }),
      providesTags: ['Leave'],
    }),
    createHoliday: builder.mutation({
      query: (data) => ({
        url: '/leaves/holidays',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Leave'],
    }),
  }),
});

export const {
  useGetLeavesQuery,
  useGetLeaveQuery,
  useApplyLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useGetLeaveBalanceQuery,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
} = leaveApiSlice;
