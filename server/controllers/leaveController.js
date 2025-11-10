const { prisma } = require('../config/database');
const { calculateLeaveDays, getPagination } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, halfDay, reason } = req.body;
    const employeeId = req.user.employee.id;

    // Calculate leave days
    let leaveDays = calculateLeaveDays(startDate, endDate);
    
    // If half day, divide by 2
    if (halfDay) {
      leaveDays = leaveDays * 0.5;
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year: currentYear
        }
      }
    });

    if (!leaveBalance) {
      return res.status(400).json({
        success: false,
        message: 'Leave balance not found for this leave type'
      });
    }

    if (leaveBalance.remainingLeaves < leaveDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${leaveBalance.remainingLeaves} days`
      });
    }

    // Check for overlapping leaves
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping leave request'
      });
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        halfDay: halfDay || false,
        reason,
        attachmentPath: req.file ? req.file.path : null
      },
      include: {
        employee: {
          include: {
            user: true,
            manager: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // Notify manager
    if (leave.employee.manager) {
      await prisma.notification.create({
        data: {
          userId: leave.employee.manager.userId,
          type: 'LEAVE_APPROVED',
          title: 'New Leave Request',
          message: `${leave.employee.firstName} ${leave.employee.lastName} has applied for ${leaveType} leave`,
          metadata: { leaveId: leave.id }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, leaveType, employeeId } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by leave type
    if (leaveType) {
      where.leaveType = leaveType;
    }

    // Filter by employee (for managers/HR)
    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    } else if (req.user.role === 'EMPLOYEE') {
      // Employees can only see their own leaves
      where.employeeId = req.user.employee.id;
    } else if (req.user.role === 'TEAM_LEAD') {
      // Team leads can see their subordinates' leaves
      const subordinates = await prisma.employee.findMany({
        where: { managerId: req.user.employee.id },
        select: { id: true }
      });
      where.employeeId = {
        in: subordinates.map(s => s.id)
      };
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip,
        take,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              designation: true,
              department: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.leave.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve leave
// @route   PUT /api/leaves/:id/approve
// @access  Private (Admin, HR, Team Lead)
exports.approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave has already been processed'
      });
    }

    // Calculate leave days
    const leaveDays = calculateLeaveDays(leave.startDate, leave.endDate);

    // Update leave balance
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.update({
      where: {
        employeeId_leaveType_year: {
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          year: currentYear
        }
      },
      data: {
        usedLeaves: { increment: leaveDays },
        remainingLeaves: { decrement: leaveDays }
      }
    });

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: leave.employee.userId,
        type: 'LEAVE_APPROVED',
        title: 'Leave Approved',
        message: `Your ${leave.leaveType} leave request has been approved`,
        senderId: req.user.id,
        metadata: { leaveId: leave.id }
      }
    });

    // Send email
    try {
      await sendEmail({
        email: leave.employee.user.email,
        subject: 'Leave Request Approved',
        html: emailTemplates.leaveApproved(
          `${leave.employee.firstName} ${leave.employee.lastName}`,
          leave.leaveType,
          leave.startDate.toLocaleDateString(),
          leave.endDate.toLocaleDateString()
        )
      });
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Leave approved successfully',
      data: updatedLeave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject leave
// @route   PUT /api/leaves/:id/reject
// @access  Private (Admin, HR, Team Lead)
exports.rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const leave = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave has already been processed'
      });
    }

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        rejectionReason,
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: leave.employee.userId,
        type: 'LEAVE_REJECTED',
        title: 'Leave Rejected',
        message: `Your ${leave.leaveType} leave request has been rejected`,
        senderId: req.user.id,
        metadata: { leaveId: leave.id }
      }
    });

    // Send email
    try {
      await sendEmail({
        email: leave.employee.user.email,
        subject: 'Leave Request Rejected',
        html: emailTemplates.leaveRejected(
          `${leave.employee.firstName} ${leave.employee.lastName}`,
          leave.leaveType,
          rejectionReason || 'No reason provided'
        )
      });
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Leave rejected',
      data: updatedLeave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave balance
// @route   GET /api/leaves/balance
// @access  Private
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const currentYear = new Date().getFullYear();

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear
      }
    });

    res.status(200).json({
      success: true,
      data: leaveBalances
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get holidays
// @route   GET /api/leaves/holidays
// @access  Private
exports.getHolidays = async (req, res, next) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create holiday
// @route   POST /api/leaves/holidays
// @access  Private (Admin, HR)
exports.createHoliday = async (req, res, next) => {
  try {
    const { name, date, description, isOptional } = req.body;

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        description,
        isOptional: isOptional || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete holiday
// @route   DELETE /api/leaves/holidays/:id
// @access  Private (Admin, HR)
exports.deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.holiday.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
