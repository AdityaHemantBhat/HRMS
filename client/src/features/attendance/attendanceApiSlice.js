import { apiSlice } from '../api/apiSlice';

export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkIn: builder.mutation({
      query: () => ({
        url: '/attendance/checkin',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),
    checkOut: builder.mutation({
      query: () => ({
        url: '/attendance/checkout',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),
    startBreak: builder.mutation({
      query: (data) => ({
        url: '/attendance/break/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    endBreak: builder.mutation({
      query: () => ({
        url: '/attendance/break/end',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/my-records',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getTodayAttendance: builder.query({
      query: () => '/attendance/today',
      providesTags: ['Attendance'],
    }),
    getEmployeeAttendance: builder.query({
      query: ({ employeeId, ...params }) => ({
        url: `/attendance/employee/${employeeId}`,
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceStats: builder.query({
      query: (params) => ({
        url: '/attendance/stats',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/all',
        params,
      }),
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetMyAttendanceQuery,
  useGetTodayAttendanceQuery,
  useGetEmployeeAttendanceQuery,
  useGetAttendanceStatsQuery,
  useGetAllAttendanceQuery,
} = attendanceApiSlice;
