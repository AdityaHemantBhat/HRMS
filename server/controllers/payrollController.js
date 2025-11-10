const { prisma } = require('../config/database');
const { getMonthDateRange, getPagination } = require('../utils/helpers');
const { generatePayslip } = require('../utils/pdfGenerator');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Generate payroll for a month
// @route   POST /api/payroll/generate
// @access  Private (Admin, HR)
exports.generatePayroll = async (req, res, next) => {
  try {
    const { month, year, employeeIds } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const { startDate, endDate } = getMonthDateRange(month, year);

    // Get employees to process
    const where = employeeIds ? { id: { in: employeeIds } } : {};
    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            isActive: true,
            email: true
          }
        }
      }
    });

    const payrollRecords = [];

    for (const employee of employees) {
      if (!employee.user.isActive) continue;
      
      // Skip admin users from payroll
      if (employee.user.role === 'ADMIN') {
        continue;
      }
      
      // Skip employees with zero or null base salary
      if (!employee.baseSalary || parseFloat(employee.baseSalary) <= 0) {
        continue;
      }

      // Check if payroll already exists
      const existingPayroll = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month,
            year
          }
        }
      });

      if (existingPayroll) {
        continue; // Skip if already generated
      }

      // Get attendance data
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate working days and hours
      const totalWorkingDays = attendances.filter(att => 
        ['PRESENT', 'LATE', 'WFH', 'HALF_DAY'].includes(att.status)
      ).length;
      
      const totalHours = attendances.reduce((sum, att) => sum + (parseFloat(att.totalHours) || 0), 0);
      const overtimeHours = attendances.reduce((sum, att) => sum + (parseFloat(att.overtimeHours) || 0), 0);
      
      // Count late days
      const lateDays = attendances.filter(att => att.status === 'LATE').length;
      
      // Count half days
      const halfDays = attendances.filter(att => att.status === 'HALF_DAY').length;
      
      // Count absent days (total days in month - working days - leaves)
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      const workingDaysInMonth = 22; // Standard working days
      
      // Calculate hourly and daily rates
      const baseSalary = parseFloat(employee.baseSalary);
      const dailyRate = baseSalary / workingDaysInMonth;
      const hourlyRate = baseSalary / (workingDaysInMonth * 9); // 9 hours per day

      // Calculate salary based on actual working days
      let calculatedBaseSalary = 0;
      if (totalWorkingDays > 0) {
        // Pay based on actual days worked
        calculatedBaseSalary = dailyRate * totalWorkingDays;
        
        // Deduct half for half days
        calculatedBaseSalary -= (dailyRate * 0.5 * halfDays);
      }

      // Calculate overtime pay (1.5x hourly rate)
      const overtimePay = overtimeHours * hourlyRate * 1.5;

      // Calculate late deductions (configurable by HR/Admin)
      // Deduct 1 hour salary per late day
      const lateDeduction = lateDays * hourlyRate;

      // Get approved leaves for the month
      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: employee.id,
          status: 'APPROVED',
          startDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate leave days and deductions based on leave type
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let leaveDeduction = 0;

      leaves.forEach(leave => {
        // Calculate number of days
        const leaveDuration = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        const actualDays = leave.halfDay ? leaveDuration * 0.5 : leaveDuration;

        // Paid leave types: SICK, CASUAL, PAID, EARNED
        const paidLeaveTypes = ['SICK', 'CASUAL', 'PAID', 'EARNED'];
        
        if (paidLeaveTypes.includes(leave.leaveType)) {
          // Paid leaves - no salary deduction
          paidLeaveDays += actualDays;
        } else {
          // Unpaid leaves (UNPAID, MATERNITY, PATERNITY, etc.) - deduct from salary
          unpaidLeaveDays += actualDays;
          leaveDeduction += dailyRate * actualDays;
        }
      });

      // Calculate total approved leave days
      const approvedLeaveDays = paidLeaveDays + unpaidLeaveDays;
      
      // Calculate absent days (days not worked and not on approved leave)
      const absentDays = Math.max(0, workingDaysInMonth - totalWorkingDays - approvedLeaveDays);
      const absentDeduction = absentDays * dailyRate;

      // Calculate gross and net salary
      const allowances = employee.allowances || {};
      const deductions = employee.deductions || {};

      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      const grossSalary = calculatedBaseSalary + totalAllowances + overtimePay;
      const netSalary = Math.max(0, grossSalary - totalDeductions - lateDeduction - absentDeduction - leaveDeduction);

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          month,
          year,
          baseSalary: employee.baseSalary,
          allowances,
          deductions,
          overtimePay,
          leaveDeductions: leaveDeduction,
          lateDeduction,
          absentDeduction,
          workingDays: totalWorkingDays,
          lateDays,
          absentDays,
          totalHours,
          grossSalary,
          netSalary,
          status: 'DRAFT'
        }
      });

      payrollRecords.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Payroll generated for ${payrollRecords.length} employees`,
      data: payrollRecords
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Private
exports.getPayrolls = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, month, year, status, employeeId } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {};

    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    // Access control based on role
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      // Employees and Team Leads can only see their own payroll
      where.employeeId = req.user.employee.id;
    } else if (employeeId) {
      // Admin/HR can filter by specific employee
      where.employeeId = parseInt(employeeId);
    }
    // Admin/HR with no employeeId filter will see all payrolls (filtered later to exclude admin)

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
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
              department: true,
              user: {
                select: {
                  role: true
                }
              }
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }),
      prisma.payroll.count({ where })
    ]);

    // Filter out admin payrolls
    const filteredPayrolls = payrolls.filter(p => p.employee?.user?.role !== 'ADMIN');

    res.status(200).json({
      success: true,
      count: filteredPayrolls.length,
      total: filteredPayrolls.length,
      totalPages: Math.ceil(filteredPayrolls.length / take),
      currentPage: parseInt(page),
      data: filteredPayrolls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payroll
// @route   GET /api/payroll/:id
// @access  Private
exports.getPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
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

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Check access
    if (req.user.role === 'EMPLOYEE' && payroll.employeeId !== req.user.employee.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payroll'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize payroll
// @route   PUT /api/payroll/:id/finalize
// @access  Private (Admin, HR)
exports.finalizePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    if (payroll.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Payroll is already finalized'
      });
    }

    // Generate payslip PDF
    const payslipPath = await generatePayslip(payroll, payroll.employee);

    // Update payroll
    const updatedPayroll = await prisma.payroll.update({
      where: { id: parseInt(id) },
      data: {
        status: 'FINALIZED',
        payslipPath
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: payroll.employee.userId,
        type: 'PAYROLL_CREDITED',
        title: 'Payroll Generated',
        message: `Your payroll for ${payroll.month}/${payroll.year} has been generated`,
        metadata: { payrollId: payroll.id }
      }
    });

    // Send email
    try {
      await sendEmail({
        email: payroll.employee.user.email,
        subject: 'Payroll Generated',
        html: emailTemplates.payrollGenerated(
          `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          payroll.month,
          payroll.year
        )
      });
    } catch (error) {
      console.error('Failed to send payroll email:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Payroll finalized successfully',
      data: updatedPayroll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download payslip
// @route   GET /api/payroll/:id/payslip
// @access  Private
exports.downloadPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Check access
    if (req.user.role === 'EMPLOYEE' && payroll.employeeId !== req.user.employee.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payslip'
      });
    }

    // Generate PDF on-the-fly
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const employeeName = `${payroll.employee.firstName}-${payroll.employee.lastName}`.replace(/\s+/g, '-');
    const filename = `${employeeName}-${payroll.employee.employeeId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('PAYSLIP', { align: 'center' });
    doc.moveDown(2);
    
    // Company info
    doc.fontSize(10).text('TalentSphere HRMS', { align: 'center' });
    doc.moveDown(2);
    
    // Employee details
    doc.fontSize(12);
    doc.text(`Employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`);
    doc.text(`Employee ID: ${payroll.employee.employeeId}`);
    doc.text(`Department: ${payroll.employee.department}`);
    doc.text(`Designation: ${payroll.employee.designation}`);
    doc.text(`Pay Period: ${getMonthName(payroll.month)} ${payroll.year}`);
    doc.moveDown();
    
    // Attendance Summary
    doc.fontSize(10);
    doc.text(`Working Days: ${payroll.workingDays || 0} | Late Days: ${payroll.lateDays || 0} | Absent Days: ${payroll.absentDays || 0}`);
    doc.text(`Total Hours Worked: ${parseFloat(payroll.totalHours || 0).toFixed(1)} hrs`);
    doc.moveDown(2);
    
    // Separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    // Earnings section
    doc.fontSize(14).text('EARNINGS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Base Salary: Rs. ${parseFloat(payroll.baseSalary).toFixed(2)}`);
    
    // Parse allowances
    const allowances = typeof payroll.allowances === 'string' 
      ? JSON.parse(payroll.allowances) 
      : payroll.allowances;
    
    if (allowances && Object.keys(allowances).length > 0) {
      Object.entries(allowances).forEach(([key, value]) => {
        doc.text(`${key.toUpperCase()}: Rs. ${parseFloat(value).toFixed(2)}`);
      });
    }
    
    doc.moveDown();
    doc.fontSize(12).text(`Gross Salary: Rs. ${parseFloat(payroll.grossSalary).toFixed(2)}`, { bold: true });
    doc.moveDown(2);
    
    // Deductions section
    doc.fontSize(14).text('DEDUCTIONS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    // Parse deductions
    const deductions = typeof payroll.deductions === 'string'
      ? JSON.parse(payroll.deductions)
      : payroll.deductions;
    
    let totalDeductions = 0;
    if (deductions && Object.keys(deductions).length > 0) {
      Object.entries(deductions).forEach(([key, value]) => {
        const amount = parseFloat(value);
        totalDeductions += amount;
        doc.text(`${key.toUpperCase()}: Rs. ${amount.toFixed(2)}`);
      });
    }
    
    // Add late, absent, and leave deductions
    if (payroll.lateDeduction && parseFloat(payroll.lateDeduction) > 0) {
      const lateAmount = parseFloat(payroll.lateDeduction);
      totalDeductions += lateAmount;
      doc.text(`LATE DEDUCTION (${payroll.lateDays || 0} days): Rs. ${lateAmount.toFixed(2)}`);
    }
    
    if (payroll.absentDeduction && parseFloat(payroll.absentDeduction) > 0) {
      const absentAmount = parseFloat(payroll.absentDeduction);
      totalDeductions += absentAmount;
      doc.text(`ABSENT DEDUCTION (${payroll.absentDays || 0} days): Rs. ${absentAmount.toFixed(2)}`);
    }
    
    if (payroll.leaveDeductions && parseFloat(payroll.leaveDeductions) > 0) {
      const leaveAmount = parseFloat(payroll.leaveDeductions);
      totalDeductions += leaveAmount;
      doc.text(`UNPAID LEAVE DEDUCTION: Rs. ${leaveAmount.toFixed(2)}`);
    }
    
    doc.moveDown();
    doc.fontSize(12).text(`Total Deductions: Rs. ${totalDeductions.toFixed(2)}`, { bold: true });
    doc.moveDown(2);
    
    // Separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    // Net salary
    doc.fontSize(16).text(`NET SALARY: Rs. ${parseFloat(payroll.netSalary).toFixed(2)}`, { bold: true });
    doc.moveDown(3);
    
    // Footer
    doc.fontSize(9).text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.text('This is a computer-generated document. No signature required.', { align: 'center' });

    // Helper function for month name
    function getMonthName(month) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return months[month - 1];
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats/overview
// @access  Private (Admin, HR)
exports.getPayrollStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [
      totalPayroll,
      avgSalary,
      totalOvertimePay,
      statusCounts
    ] = await Promise.all([
      prisma.payroll.aggregate({
        where: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear)
        },
        _sum: {
          netSalary: true
        }
      }),
      prisma.payroll.aggregate({
        where: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear)
        },
        _avg: {
          netSalary: true
        }
      }),
      prisma.payroll.aggregate({
        where: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear)
        },
        _sum: {
          overtimePay: true
        }
      }),
      prisma.payroll.groupBy({
        by: ['status'],
        where: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear)
        },
        _count: true
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayroll: totalPayroll._sum.netSalary || 0,
        avgSalary: avgSalary._avg.netSalary || 0,
        totalOvertimePay: totalOvertimePay._sum.overtimePay || 0,
        statusCounts,
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payroll record
// @route   DELETE /api/payroll/:id
// @access  Private (Admin, HR)
exports.deletePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id: parseInt(id) }
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Only allow deletion of DRAFT payrolls
    if (payroll.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete finalized payroll. Please contact system administrator.'
      });
    }

    await prisma.payroll.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Recalculate payroll for specific employee
// @route   PUT /api/payroll/:id/recalculate
// @access  Private (Admin, HR)
exports.recalculatePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: {
              select: {
                isActive: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!existingPayroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Only allow recalculation of DRAFT payrolls
    if (existingPayroll.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot recalculate finalized payroll'
      });
    }

    const employee = existingPayroll.employee;
    const month = existingPayroll.month;
    const year = existingPayroll.year;

    const { startDate, endDate } = getMonthDateRange(month, year);

    // Get attendance data
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate working days and hours
    const totalWorkingDays = attendances.filter(att => 
      ['PRESENT', 'LATE', 'WFH', 'HALF_DAY'].includes(att.status)
    ).length;
    
    const totalHours = attendances.reduce((sum, att) => sum + (parseFloat(att.totalHours) || 0), 0);
    const overtimeHours = attendances.reduce((sum, att) => sum + (parseFloat(att.overtimeHours) || 0), 0);
    
    const lateDays = attendances.filter(att => att.status === 'LATE').length;
    const halfDays = attendances.filter(att => att.status === 'HALF_DAY').length;
    
    const workingDaysInMonth = 22;
    const baseSalary = parseFloat(employee.baseSalary);
    const dailyRate = baseSalary / workingDaysInMonth;
    const hourlyRate = baseSalary / (workingDaysInMonth * 9);

    let calculatedBaseSalary = 0;
    if (totalWorkingDays > 0) {
      calculatedBaseSalary = dailyRate * totalWorkingDays;
      calculatedBaseSalary -= (dailyRate * 0.5 * halfDays);
    }

    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const lateDeduction = lateDays * hourlyRate;

    // Get approved leaves
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId: employee.id,
        status: 'APPROVED',
        startDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let leaveDeduction = 0;

    leaves.forEach(leave => {
      const leaveDuration = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const actualDays = leave.halfDay ? leaveDuration * 0.5 : leaveDuration;

      const paidLeaveTypes = ['SICK', 'CASUAL', 'PAID', 'EARNED'];
      
      if (paidLeaveTypes.includes(leave.leaveType)) {
        paidLeaveDays += actualDays;
      } else {
        unpaidLeaveDays += actualDays;
        leaveDeduction += dailyRate * actualDays;
      }
    });

    const approvedLeaveDays = paidLeaveDays + unpaidLeaveDays;
    const absentDays = Math.max(0, workingDaysInMonth - totalWorkingDays - approvedLeaveDays);
    const absentDeduction = absentDays * dailyRate;

    const allowances = employee.allowances || {};
    const deductions = employee.deductions || {};

    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);

    const grossSalary = calculatedBaseSalary + totalAllowances + overtimePay;
    const netSalary = Math.max(0, grossSalary - totalDeductions - lateDeduction - absentDeduction - leaveDeduction);

    // Update payroll record
    const updatedPayroll = await prisma.payroll.update({
      where: { id: parseInt(id) },
      data: {
        baseSalary: employee.baseSalary,
        allowances,
        deductions,
        overtimePay,
        leaveDeductions: leaveDeduction,
        lateDeduction,
        absentDeduction,
        workingDays: totalWorkingDays,
        lateDays,
        absentDays,
        totalHours,
        grossSalary,
        netSalary
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payroll recalculated successfully',
      data: updatedPayroll
    });
  } catch (error) {
    next(error);
  }
};
