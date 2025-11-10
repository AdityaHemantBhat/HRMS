const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignEmployee,
  removeEmployee,
  getTasks,
  createTask,
  updateTask,
  logTaskTime,
  getMyProjects,
  getMyTaskLogs
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);

// My projects route (for employees to see assigned projects)
router.get('/my-projects', getMyProjects);

// Task routes
router.get('/tasks/my-logs', getMyTaskLogs);
router.get('/tasks', getTasks);
router.post('/tasks', authorize('ADMIN', 'HR', 'TEAM_LEAD'), validate(schemas.createTask), createTask);
router.put('/tasks/:id', updateTask);
router.post('/tasks/:id/log', validate(schemas.logTaskTime), logTaskTime);

// Project routes
router.get('/', authorize('ADMIN', 'HR', 'TEAM_LEAD'), getProjects);
router.get('/:id', getProject);
router.post('/', authorize('ADMIN', 'HR', 'TEAM_LEAD'), validate(schemas.createProject), createProject);
router.put('/:id', authorize('ADMIN', 'HR', 'TEAM_LEAD'), updateProject);
router.delete('/:id', authorize('ADMIN'), deleteProject);
router.post('/:id/assign', authorize('ADMIN', 'HR', 'TEAM_LEAD'), assignEmployee);
router.delete('/:id/assign/:assignmentId', authorize('ADMIN', 'HR', 'TEAM_LEAD'), removeEmployee);

module.exports = router;
