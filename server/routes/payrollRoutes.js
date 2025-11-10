const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getPayrolls,
  getPayroll,
  finalizePayroll,
  downloadPayslip,
  getPayrollStats,
  deletePayroll,
  recalculatePayroll
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/overview', authorize('ADMIN', 'HR'), getPayrollStats);
router.post('/generate', authorize('ADMIN', 'HR'), generatePayroll);
router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.put('/:id/finalize', authorize('ADMIN', 'HR'), finalizePayroll);
router.put('/:id/recalculate', authorize('ADMIN', 'HR'), recalculatePayroll);
router.delete('/:id', authorize('ADMIN', 'HR'), deletePayroll);
router.get('/:id/payslip', downloadPayslip);

module.exports = router;
