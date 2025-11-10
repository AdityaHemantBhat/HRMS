const { prisma } = require('../config/database');
const { calculateHours, formatDate, isToday, getMonthDateRange } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Check in
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const now = new Date();
    const today = formatDate(now);

    // Check if already checked in today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Check if late (after 9:30 AM grace period)
    const checkInTime = now.getHours() * 60 + now.getMinutes();
    const graceTime = 9 * 60 + 30; // 9:30 AM (30 min grace period)
    const isLate = checkInTime > graceTime;

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      },
      update: {
        checkIn: now,
        status: isLate ? 'LATE' : 'PRESENT'
      },
      create: {
        employeeId,
        date: new Date(today),
        checkIn: now,
        status: isLate ? 'LATE' : 'PRESENT'
      }
    });

    // Send late login notification
    if (isLate) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: employee.userId,
          type: 'LATE_LOGIN',
          title: 'Late Check-in',
          message: `You checked in late at ${now.toLocaleTimeString()}`
        }
      });

      // Send email (optional)
      try {
        await sendEmail({
          email: employee.user.email,
          subject: 'Late Check-in Alert',
          html: emailTemplates.lateLogin(
            `${employee.firstName} ${employee.lastName}`,
            now.toLocaleTimeString()
          )
        });
      } catch (error) {
        console.error('Failed to send late login email:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check out
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const now = new Date();
    const today = formatDate(now);

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Calculate total hours
    const totalHours = calculateHours(attendance.checkIn, now);
    
    // Calculate overtime (if worked more than 9 hours)
    const overtimeHours = Math.max(0, parseFloat(totalHours) - 9);

    // Check if checking out before 6:30 PM (grace period)
    const checkOutTime = now.getHours() * 60 + now.getMinutes();
    const earlyCheckOutGrace = 18 * 60 + 30; // 6:30 PM
    const isEarlyCheckOut = checkOutTime < earlyCheckOutGrace;

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        totalHours: parseFloat(totalHours),
        overtimeHours: overtimeHours,
        notes: isEarlyCheckOut ? 'Early check-out' : attendance.notes
      }
    });

    // Send notification if early checkout
    if (isEarlyCheckOut) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true }
      });

      await prisma.notification.create({
        data: {
          userId: employee.userId,
          type: 'MISSED_LOGOUT',
          title: 'Early Check-out',
          message: `You checked out early at ${now.toLocaleTimeString()}. Standard time is 6:30 PM.`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: updatedAttendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start break
// @route   POST /api/attendance/break/start
// @access  Private
exports.startBreak = async (req, res, next) => {
  try {
    const { breakType } = req.body; // TEA or LUNCH
    const employeeId = req.user.employee.id;
    const now = new Date();
    const today = formatDate(now);

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }

    // Check if there's an ongoing break
    const ongoingBreak = await prisma.break.findFirst({
      where: {
        attendanceId: attendance.id,
        endTime: null
      }
    });

    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'Please end your current break first'
      });
    }

    const breakRecord = await prisma.break.create({
      data: {
        attendanceId: attendance.id,
        breakType,
        startTime: now
      }
    });

    res.status(200).json({
      success: true,
      message: `${breakType} break started`,
      data: breakRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End break
// @route   POST /api/attendance/break/end
// @access  Private
exports.endBreak = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const now = new Date();
    const today = formatDate(now);

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found'
      });
    }

    const ongoingBreak = await prisma.break.findFirst({
      where: {
        attendanceId: attendance.id,
        endTime: null
      }
    });

    if (!ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'No ongoing break found'
      });
    }

    // Calculate duration in minutes
    const duration = Math.round((now - new Date(ongoingBreak.startTime)) / (1000 * 60));

    const updatedBreak = await prisma.break.update({
      where: { id: ongoingBreak.id },
      data: {
        endTime: now,
        duration
      }
    });

    res.status(200).json({
      success: true,
      message: 'Break ended',
      data: updatedBreak
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my attendance records
// @route   GET /api/attendance/my-records
// @access  Private
exports.getMyAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const { month, year } = req.query;

    let where = { employeeId };

    if (month && year) {
      const { startDate, endDate } = getMonthDateRange(parseInt(month), parseInt(year));
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        breaks: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance by employee
// @route   GET /api/attendance/employee/:employeeId
// @access  Private (Admin, HR, Team Lead)
exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    let where = { employeeId: parseInt(employeeId) };

    if (month && year) {
      const { startDate, endDate } = getMonthDateRange(parseInt(month), parseInt(year));
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        breaks: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            designation: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const today = formatDate(new Date());

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(today)
        }
      },
      include: {
        breaks: true
      }
    });

    // Check for ongoing break
    let ongoingBreak = null;
    if (attendance) {
      ongoingBreak = await prisma.break.findFirst({
        where: {
          attendanceId: attendance.id,
          endTime: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendance,
        ongoingBreak
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees attendance (Admin/HR view)
// @route   GET /api/attendance/all
// @access  Private (Admin, HR)
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { month, year, startDate, endDate, department, status, page = 1, limit = 50 } = req.query;

    let where = {};

    // Filter by custom date range (takes priority)
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    // Filter by month and year (fallback)
    else if (month && year) {
      const dateRange = getMonthDateRange(parseInt(month), parseInt(year));
      where.date = {
        gte: dateRange.startDate,
        lte: dateRange.endDate
      };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by department
    if (department) {
      where.employee = {
        department
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
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
          },
          breaks: true
        },
        orderBy: [
          { date: 'desc' },
          { employee: { firstName: 'asc' } }
        ]
      }),
      prisma.attendance.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Admin, HR)
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const { startDate, endDate } = getMonthDateRange(parseInt(currentMonth), parseInt(currentYear));

    const [
      totalPresent,
      totalAbsent,
      totalLate,
      avgHours
    ] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: { gte: startDate, lte: endDate },
          status: { in: ['PRESENT', 'LATE'] }
        }
      }),
      prisma.attendance.count({
        where: {
          date: { gte: startDate, lte: endDate },
          status: 'ABSENT'
        }
      }),
      prisma.attendance.count({
        where: {
          date: { gte: startDate, lte: endDate },
          status: 'LATE'
        }
      }),
      prisma.attendance.aggregate({
        where: {
          date: { gte: startDate, lte: endDate },
          totalHours: { not: null }
        },
        _avg: {
          totalHours: true
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPresent,
        totalAbsent,
        totalLate,
        avgHours: avgHours._avg.totalHours || 0,
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    next(error);
  }
};
