const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocuments,
  getEmployeeStats
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/stats/overview', authorize('ADMIN', 'HR'), getEmployeeStats);
router.get('/', authorize('ADMIN', 'HR', 'TEAM_LEAD'), getEmployees);
router.get('/:id', getEmployee);
router.post('/', authorize('ADMIN', 'HR'), validate(schemas.createEmployee), createEmployee);
router.put('/:id', authorize('ADMIN', 'HR'), validate(schemas.updateEmployee), updateEmployee);
router.delete('/:id', authorize('ADMIN'), deleteEmployee);

router.post('/:id/documents', 
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 }
  ]),
  uploadDocuments
);

module.exports = router;
