import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Button, Drawer } from 'antd';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  IndianRupee,
  FolderKanban,
  Target,
  Bell,
  User,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Megaphone,
  FileText,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { logout } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/authApiSlice';
import { selectUnreadCount } from '../features/notifications/notificationSlice';
import { apiSlice } from '../features/api/apiSlice';
import NotificationDrawer from './NotificationDrawer';
import AttendanceAlerts from './AttendanceAlerts';
import '../styles/layout.scss';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const unreadCount = useSelector(selectUnreadCount);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      // Clear token from localStorage
      localStorage.removeItem('token');
      dispatch(logout());
      // Reset all RTK Query cache to clear stale data
      dispatch(apiSlice.util.resetApiState());
      navigate('/login');
    } catch (error) {
      // Even if logout API fails, clear local state and cache
      localStorage.removeItem('token');
      dispatch(logout());
      dispatch(apiSlice.util.resetApiState());
      navigate('/login');
    }
  };

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
    },
    {
      key: '/employees',
      icon: <Users size={20} />,
      label: 'Employees',
      roles: ['ADMIN', 'HR', 'TEAM_LEAD'],
    },
    {
      key: '/attendance',
      icon: <Clock size={20} />,
      label: 'Attendance',
    },
    {
      key: '/leaves',
      icon: <Calendar size={20} />,
      label: 'Leaves',
    },
    {
      key: '/payroll',
      icon: <IndianRupee size={20} />,
      label: 'Payroll',
    },
    {
      key: '/projects',
      icon: <FolderKanban size={20} />,
      label: 'Projects',
    },
    {
      key: '/performance',
      icon: <Target size={20} />,
      label: 'Performance',
    },
    {
      key: '/announcements',
      icon: <Megaphone size={20} />,
      label: 'Announcements',
    },
    {
      key: 'reports',
      icon: <FileText size={20} />,
      label: 'Reports',
      roles: ['ADMIN', 'HR'],
      children: [
        {
          key: '/reports/attendance',
          label: 'Attendance Report',
        },
      ],
    },
    {
      key: 'settings',
      icon: <Settings size={20} />,
      label: 'Settings',
      roles: ['ADMIN', 'HR'],
      children: [
        {
          key: '/settings/departments',
          label: 'Departments',
        },
        {
          key: '/settings/leave-types',
          label: 'Leave Types',
        },
        {
          key: '/settings/holidays',
          label: 'Holidays',
        },
        {
          key: '/settings/roles',
          label: 'Roles & Permissions',
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const sidebarContent = (
    <>
      <div className="logo">
        <h2>{collapsed ? 'TS' : 'TalentSphere'}</h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={filteredMenuItems}
        onClick={({ key }) => {
          navigate(key);
          setMobileDrawerOpen(false);
        }}
      />
    </>
  );

  return (
    <AntLayout className="app-layout">
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="app-sider desktop-sider"
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        className="mobile-drawer"
        width={250}
        styles={{ body: { padding: 0, background: '#001529' } }}
      >
        {sidebarContent}
      </Drawer>

      <AntLayout className="main-layout" style={{ marginLeft: window.innerWidth >= 992 ? (collapsed ? 80 : 200) : 0, transition: 'margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuIcon size={20} />}
              onClick={() => {
                if (window.innerWidth < 992) {
                  setMobileDrawerOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="trigger-btn"
            />
          </div>

          <div className="header-right">
            <Badge count={unreadCount} offset={[-5, 5]}>
              <Button
                type="text"
                icon={<Bell size={20} />}
                onClick={() => setNotificationDrawerOpen(true)}
                className="icon-btn"
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar size="default" style={{ backgroundColor: '#1890ff' }}>
                  {user?.employee?.firstName?.[0]}
                  {user?.employee?.lastName?.[0]}
                </Avatar>
                <div className="user-details">
                  <span className="user-name">
                    {user?.employee?.firstName} {user?.employee?.lastName}
                  </span>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="app-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </AntLayout>

      <NotificationDrawer
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
      
      <AttendanceAlerts />
    </AntLayout>
  );
};

export default Layout;
