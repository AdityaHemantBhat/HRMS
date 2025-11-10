const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createEmployee: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE').default('EMPLOYEE'),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().optional(),
    phone: Joi.string().optional(),
    emergencyContact: Joi.string().optional(),
    address: Joi.string().optional(),
    employeeId: Joi.string().required(),
    designation: Joi.string().required(),
    department: Joi.string().required(),
    joiningDate: Joi.date().optional(),
    managerId: Joi.number().optional(),
    baseSalary: Joi.number().required(),
    allowances: Joi.object().optional(),
    deductions: Joi.object().optional(),
    bankName: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    ifscCode: Joi.string().optional()
  }),

  updateEmployee: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().optional(),
    phone: Joi.string().optional(),
    emergencyContact: Joi.string().optional(),
    address: Joi.string().optional(),
    designation: Joi.string().optional(),
    department: Joi.string().optional(),
    managerId: Joi.number().optional(),
    baseSalary: Joi.number().optional(),
    allowances: Joi.object().optional(),
    deductions: Joi.object().optional(),
    bankName: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    ifscCode: Joi.string().optional(),
    isActive: Joi.boolean().optional()
  }),

  applyLeave: Joi.object({
    leaveType: Joi.string().valid('SICK', 'CASUAL', 'PAID', 'EARNED', 'MATERNITY', 'PATERNITY', 'HALF_DAY', 'WFH').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    reason: Joi.string().required()
  }),

  createProject: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED').optional(),
    employeeIds: Joi.array().items(Joi.number()).optional()
  }),

  createTask: Joi.object({
    projectId: Joi.number().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
    estimatedHours: Joi.number().optional()
  }),

  logTaskTime: Joi.object({
    taskId: Joi.number().required(),
    hoursWorked: Joi.number().required(),
    date: Joi.date().optional(),
    notes: Joi.string().optional()
  }),

  createGoal: Joi.object({
    employeeId: Joi.number().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    targetDate: Joi.date().required()
  }),

  createFeedback: Joi.object({
    employeeId: Joi.number().required(),
    feedbackText: Joi.string().required(),
    rating: Joi.number().min(1).max(5).optional(),
    category: Joi.string().optional()
  })
};

module.exports = { validate, schemas };
