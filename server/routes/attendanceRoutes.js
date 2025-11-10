const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getMyAttendance,
  getEmployeeAttendance,
  getTodayAttendance,
  getAllAttendance,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);
router.get('/my-records', getMyAttendance);
router.get('/today', getTodayAttendance);
router.get('/all', authorize('ADMIN', 'HR'), getAllAttendance);
router.get('/stats', authorize('ADMIN', 'HR'), getAttendanceStats);
router.get('/employee/:employeeId', authorize('ADMIN', 'HR', 'TEAM_LEAD'), getEmployeeAttendance);

module.exports = router;
