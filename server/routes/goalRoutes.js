const express = require('express');
const router = express.Router();
const {
  getMyGoals,
  getAllGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal
} = require('../controllers/goalController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// My goals routes
router.get('/', getMyGoals);
router.post('/', createGoal);

// All goals (managers only)
router.get('/all', authorize('ADMIN', 'HR', 'TEAM_LEAD'), getAllGoals);

// Single goal routes
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
