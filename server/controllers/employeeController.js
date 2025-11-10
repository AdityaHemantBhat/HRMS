const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { getPagination } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin, HR, Team Lead)
exports.getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, role } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { designation: { contains: search } }
      ];
    }

    // Department filter
    if (department) {
      where.department = department;
    }

    // Role filter
    if (role) {
      where.user = {
        role: role
      };
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.employee.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true
          }
        },
        leaveBalances: true
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private (Admin, HR)
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      emergencyContact,
      address,
      employeeId,
      designation,
      department,
      joiningDate,
      managerId,
      baseSalary,
      allowances,
      deductions,
      bankName,
      accountNumber,
      ifscCode
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and employee
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        employee: {
          create: {
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
            phone,
            emergencyContact,
            address,
            employeeId,
            designation,
            department,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            managerId: managerId ? parseInt(managerId) : null,
            baseSalary,
            allowances,
            deductions,
            bankName,
            accountNumber,
            ifscCode
          }
        }
      },
      include: {
        employee: true
      }
    });

    // Initialize leave balances
    const currentYear = new Date().getFullYear();
    const leaveTypes = ['SICK', 'CASUAL', 'PAID', 'EARNED'];
    const leaveQuotas = {
      SICK: 12,
      CASUAL: 12,
      PAID: 15,
      EARNED: 15
    };

    await Promise.all(
      leaveTypes.map(leaveType =>
        prisma.leaveBalance.create({
          data: {
            employeeId: user.employee.id,
            leaveType,
            totalLeaves: leaveQuotas[leaveType],
            usedLeaves: 0,
            remainingLeaves: leaveQuotas[leaveType],
            year: currentYear
          }
        })
      )
    );

    // Send welcome email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to TalentSphere',
        html: emailTemplates.welcome(`${firstName} ${lastName}`)
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin, HR)
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update user active status if provided
    if (updateData.isActive !== undefined) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: {
          isActive: updateData.isActive
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Delete user (will cascade delete employee)
    await prisma.user.delete({
      where: { id: employee.userId }
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload employee documents
// @route   POST /api/employees/:id/documents
// @access  Private
exports.uploadDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const updateData = {};

    if (files.resume) {
      updateData.resumePath = files.resume[0].path;
    }
    if (files.idProof) {
      updateData.idProofPath = files.idProof[0].path;
    }
    if (files.offerLetter) {
      updateData.offerLetterPath = files.offerLetter[0].path;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats/overview
// @access  Private (Admin, HR)
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      departmentCounts,
      roleCounts
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.employee.groupBy({
        by: ['department'],
        _count: true
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        departmentCounts,
        roleCounts
      }
    });
  } catch (error) {
    next(error);
  }
};
