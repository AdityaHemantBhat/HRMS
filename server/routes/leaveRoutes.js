const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  getLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  getHolidays,
  createHoliday,
  deleteHoliday
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/balance', getLeaveBalance);
router.get('/holidays', getHolidays);
router.post('/holidays', authorize('ADMIN', 'HR'), createHoliday);
router.delete('/holidays/:id', authorize('ADMIN', 'HR'), deleteHoliday);

router.get('/', getLeaves);
router.get('/:id', getLeave);
router.post('/', upload.single('attachment'), validate(schemas.applyLeave), applyLeave);
router.put('/:id/approve', authorize('ADMIN', 'HR', 'TEAM_LEAD'), approveLeave);
router.put('/:id/reject', authorize('ADMIN', 'HR', 'TEAM_LEAD'), rejectLeave);

module.exports = router;
