const { prisma } = require('../config/database');
const { getMonthDateRange } = require('../utils/helpers');

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const employeeId = req.user.employee?.id;

    let data = {};

    if (userRole === 'ADMIN' || userRole === 'HR') {
      // Admin/HR Dashboard
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);

      const [
        totalEmployees,
        activeEmployees,
        totalDepartments,
        pendingLeaves,
        todayAttendance,
        monthlyPayroll,
        recentHires
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.employee.groupBy({
          by: ['department'],
          _count: true
        }),
        prisma.leave.count({
          where: { status: 'PENDING' }
        }),
        prisma.attendance.count({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999))
            },
            status: { in: ['PRESENT', 'LATE'] }
          }
        }),
        prisma.payroll.aggregate({
          where: {
            month: currentMonth,
            year: currentYear
          },
          _sum: {
            netSalary: true
          }
        }),
        prisma.employee.findMany({
          take: 5,
          orderBy: {
            joiningDate: 'desc'
          },
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        })
      ]);

      data = {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees
        },
        departments: totalDepartments.length,
        leaves: {
          pending: pendingLeaves
        },
        attendance: {
          today: todayAttendance
        },
        payroll: {
          monthlyTotal: monthlyPayroll._sum.netSalary || 0
        },
        recentHires
      };
    } else if (userRole === 'TEAM_LEAD') {
      // Team Lead Dashboard
      const [
        teamMembers,
        pendingLeaves,
        teamAttendanceToday
      ] = await Promise.all([
        prisma.employee.findMany({
          where: { managerId: employeeId },
          include: {
            user: {
              select: {
                isActive: true
              }
            }
          }
        }),
        prisma.leave.count({
          where: {
            status: 'PENDING',
            employee: {
              managerId: employeeId
            }
          }
        }),
        prisma.attendance.count({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999))
            },
            employee: {
              managerId: employeeId
            },
            status: { in: ['PRESENT', 'LATE'] }
          }
        })
      ]);

      data = {
        team: {
          total: teamMembers.length,
          active: teamMembers.filter(m => m.user.isActive).length
        },
        leaves: {
          pending: pendingLeaves
        },
        attendance: {
          today: teamAttendanceToday
        }
      };
    } else {
      // Employee Dashboard
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);

      const [
        todayAttendance,
        monthAttendance,
        leaveBalance,
        pendingLeaves,
        recentPayroll,
        myGoals
      ] = await Promise.all([
        prisma.attendance.findFirst({
          where: {
            employeeId,
            date: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
              lte: new Date(today.setHours(23, 59, 59, 999))
            }
          },
          include: {
            breaks: true
          }
        }),
        prisma.attendance.count({
          where: {
            employeeId,
            date: {
              gte: startDate,
              lte: endDate
            },
            status: { in: ['PRESENT', 'LATE'] }
          }
        }),
        prisma.leaveBalance.findMany({
          where: {
            employeeId,
            year: currentYear
          }
        }),
        prisma.leave.count({
          where: {
            employeeId,
            status: 'PENDING'
          }
        }),
        prisma.payroll.findFirst({
          where: { employeeId },
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ]
        }),
        prisma.goal.findMany({
          where: {
            employeeId,
            status: 'IN_PROGRESS'
          },
          take: 5
        })
      ]);

      data = {
        attendance: {
          today: todayAttendance,
          thisMonth: monthAttendance
        },
        leaves: {
          balance: leaveBalance,
          pending: pendingLeaves
        },
        payroll: {
          latest: recentPayroll
        },
        goals: {
          active: myGoals
        }
      };
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance analytics
// @route   GET /api/dashboard/attendance-analytics
// @access  Private (Admin, HR)
exports.getAttendanceAnalytics = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const { startDate, endDate } = getMonthDateRange(parseInt(currentMonth), parseInt(currentYear));

    const [
      dailyAttendance,
      statusBreakdown,
      departmentAttendance
    ] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      }),
      prisma.$queryRaw`
        SELECT e.department, COUNT(*) as count
        FROM Attendance a
        JOIN Employee e ON a.employeeId = e.id
        WHERE a.date >= ${startDate} AND a.date <= ${endDate}
        GROUP BY e.department
      `
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyAttendance,
        statusBreakdown,
        departmentAttendance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave analytics
// @route   GET /api/dashboard/leave-analytics
// @access  Private (Admin, HR)
exports.getLeaveAnalytics = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const [
      leavesByType,
      leavesByStatus,
      leavesByDepartment
    ] = await Promise.all([
      prisma.leave.groupBy({
        by: ['leaveType'],
        where: {
          startDate: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`)
          }
        },
        _count: true
      }),
      prisma.leave.groupBy({
        by: ['status'],
        where: {
          startDate: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`)
          }
        },
        _count: true
      }),
      prisma.$queryRaw`
        SELECT e.department, COUNT(*) as count
        FROM Leave l
        JOIN Employee e ON l.employeeId = e.id
        WHERE YEAR(l.startDate) = ${currentYear}
        GROUP BY e.department
      `
    ]);

    res.status(200).json({
      success: true,
      data: {
        leavesByType,
        leavesByStatus,
        leavesByDepartment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payroll analytics
// @route   GET /api/dashboard/payroll-analytics
// @access  Private (Admin, HR)
exports.getPayrollAnalytics = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const monthlyPayroll = await prisma.payroll.groupBy({
      by: ['month'],
      where: {
        year: currentYear
      },
      _sum: {
        netSalary: true,
        overtimePay: true
      },
      _avg: {
        netSalary: true
      }
    });

    const departmentPayroll = await prisma.$queryRaw`
      SELECT e.department, 
             SUM(p.netSalary) as totalSalary,
             AVG(p.netSalary) as avgSalary,
             COUNT(*) as employeeCount
      FROM Payroll p
      JOIN Employee e ON p.employeeId = e.id
      WHERE p.year = ${currentYear}
      GROUP BY e.department
    `;

    res.status(200).json({
      success: true,
      data: {
        monthlyPayroll,
        departmentPayroll
      }
    });
  } catch (error) {
    next(error);
  }
};
