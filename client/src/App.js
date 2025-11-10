import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from './features/auth/authApiSlice';
import { setCredentials, logout } from './features/auth/authSlice';
import { apiSlice } from './features/api/apiSlice';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetails from './pages/employees/EmployeeDetails';
import Attendance from './pages/attendance/Attendance';
import LeaveManagement from './pages/leaves/LeaveManagement';
import PayrollList from './pages/payroll/PayrollList';
import ProjectList from './pages/projects/ProjectList';
import Performance from './pages/performance/Performance';
import Profile from './pages/Profile';
import LeaveTypeSettings from './pages/settings/LeaveTypeSettings';
import HolidayManagement from './pages/settings/HolidayManagement';
import DepartmentManagement from './pages/settings/DepartmentManagement';
import RolePermissions from './pages/settings/RolePermissions';
import Announcements from './pages/announcements/Announcements';
import DetailedAttendanceReport from './pages/reports/DetailedAttendanceReport';
import NotFound from './pages/NotFound';

function App() {
  const dispatch = useDispatch();
  
  // Only call getMe if we have a token
  const hasToken = !!localStorage.getItem('token');
  
  const { data, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: !hasToken, // Skip the query if no token exists
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    if (isSuccess && data?.data) {
      dispatch(setCredentials(data.data));
    }
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    if (isError) {
      // Clear any stale auth state and cache on error
      localStorage.removeItem('token');
      dispatch(logout());
      dispatch(apiSlice.util.resetApiState());
    }
  }, [isError, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/:id" element={<EmployeeDetails />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="payroll" element={<PayrollList />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="performance" element={<Performance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports/attendance" element={<DetailedAttendanceReport />} />
        <Route path="settings/leave-types" element={<LeaveTypeSettings />} />
        <Route path="settings/holidays" element={<HolidayManagement />} />
        <Route path="settings/departments" element={<DepartmentManagement />} />
        <Route path="settings/roles" element={<RolePermissions />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
