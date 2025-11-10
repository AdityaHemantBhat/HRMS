import React, { useEffect, useState } from 'react';
import { notification } from 'antd';
import { Clock, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetTodayAttendanceQuery } from '../features/attendance/attendanceApiSlice';

const AttendanceAlerts = () => {
  const { data: todayData } = useGetTodayAttendanceQuery(undefined, {
    pollingInterval: 60000, // Check every minute
  });
  const [lastAlertTime, setLastAlertTime] = useState(null);

  useEffect(() => {
    const checkAttendance = () => {
      const now = dayjs();
      const currentHour = now.hour();
      const currentMinute = now.minute();
      const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight

      const todayAttendance = todayData?.data?.attendance;

      // Check-in alerts (9:30 AM to 11:00 AM)
      const graceEndTime = 9 * 60 + 30; // 9:30 AM
      const checkInAlertEndTime = 11 * 60; // 11:00 AM

      if (!todayAttendance && currentTime >= graceEndTime && currentTime < checkInAlertEndTime) {
        // Show alert every 10 minutes
        const minutesSinceGrace = currentTime - graceEndTime;
        const shouldAlert = minutesSinceGrace % 10 === 0;

        if (shouldAlert && lastAlertTime !== currentTime) {
          notification.warning({
            message: 'Check-In Reminder',
            description: `You haven't checked in yet! It's ${now.format('h:mm A')}. Please check in now.`,
            icon: <AlertCircle style={{ color: '#faad14' }} />,
            duration: 10,
            placement: 'topRight',
          });
          setLastAlertTime(currentTime);
        }
      }

      // Check-out alerts (6:30 PM to 8:00 PM)
      const checkOutGraceEnd = 18 * 60 + 30; // 6:30 PM
      const checkOutAlertEnd = 20 * 60; // 8:00 PM

      if (
        todayAttendance &&
        todayAttendance.checkIn &&
        !todayAttendance.checkOut &&
        currentTime >= checkOutGraceEnd &&
        currentTime < checkOutAlertEnd
      ) {
        const minutesSinceGrace = currentTime - checkOutGraceEnd;
        const shouldAlert = minutesSinceGrace % 10 === 0;

        if (shouldAlert && lastAlertTime !== currentTime) {
          notification.warning({
            message: 'Check-Out Reminder',
            description: `You haven't checked out yet! It's ${now.format('h:mm A')}. Please check out now.`,
            icon: <Clock style={{ color: '#faad14' }} />,
            duration: 10,
            placement: 'topRight',
          });
          setLastAlertTime(currentTime);
        }
      }
    };

    // Check immediately
    checkAttendance();

    // Then check every minute
    const interval = setInterval(checkAttendance, 60000);

    return () => clearInterval(interval);
  }, [todayData, lastAlertTime]);

  return null; // This component doesn't render anything
};

export default AttendanceAlerts;
