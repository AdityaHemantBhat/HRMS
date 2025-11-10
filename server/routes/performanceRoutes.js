const express = require('express');
const router = express.Router();
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getFeedback,
  createFeedback,
  getPerformanceStats
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);

router.get('/goals', getGoals);
router.get('/goals/:id', getGoal);
router.post('/goals', authorize('ADMIN', 'HR', 'TEAM_LEAD'), validate(schemas.createGoal), createGoal);
router.put('/goals/:id', updateGoal);
router.delete('/goals/:id', authorize('ADMIN', 'HR', 'TEAM_LEAD'), deleteGoal);

router.get('/feedback', getFeedback);
router.post('/feedback', validate(schemas.createFeedback), createFeedback);

router.get('/stats/:employeeId', getPerformanceStats);

module.exports = router;
