const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getAttendanceAnalytics,
  getLeaveAnalytics,
  getPayrollAnalytics
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/overview', getDashboardOverview);
router.get('/attendance-analytics', authorize('ADMIN', 'HR'), getAttendanceAnalytics);
router.get('/leave-analytics', authorize('ADMIN', 'HR'), getLeaveAnalytics);
router.get('/payroll-analytics', authorize('ADMIN', 'HR'), getPayrollAnalytics);

module.exports = router;
