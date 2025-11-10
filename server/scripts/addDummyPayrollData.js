const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addDummyPayrollData() {
  try {
    console.log('🚀 Starting to add dummy payroll data...\n');

    // Current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📅 Current Month: ${currentMonth}, Year: ${currentYear}\n`);

    // Create dummy employees with different scenarios
    const dummyEmployees = [
      {
        email: 'john.doe@test.com',
        password: 'Test@123',
        firstName: 'John',
        lastName: 'Doe',
        employeeId: 'EMP-TEST-001',
        department: 'Engineering',
        designation: 'Senior Developer',
        baseSalary: 80000,
        allowances: { hra: 15000, transport: 3000, medical: 2000 },
        deductions: { pf: 5000, tax: 8000, insurance: 2000 },
        workingDays: 22, // Full attendance
        lateDays: 0,
        absentDays: 0,
        overtimeHours: 10
      },
      {
        email: 'jane.smith@test.com',
        password: 'Test@123',
        firstName: 'Jane',
        lastName: 'Smith',
        employeeId: 'EMP-TEST-002',
        department: 'Marketing',
        designation: 'Marketing Manager',
        baseSalary: 60000,
        allowances: { hra: 12000, transport: 2500 },
        deductions: { pf: 4000, tax: 6000 },
        workingDays: 20, // 2 days absent
        lateDays: 3,
        absentDays: 2,
        overtimeHours: 5
      },
      {
        email: 'mike.wilson@test.com',
        password: 'Test@123',
        firstName: 'Mike',
        lastName: 'Wilson',
        employeeId: 'EMP-TEST-003',
        department: 'Sales',
        designation: 'Sales Executive',
        baseSalary: 50000,
        allowances: { hra: 10000, transport: 2000, commission: 5000 },
        deductions: { pf: 3500, tax: 5000 },
        workingDays: 18, // 4 days absent
        lateDays: 5,
        absentDays: 4,
        overtimeHours: 0
      },
      {
        email: 'sarah.jones@test.com',
        password: 'Test@123',
        firstName: 'Sarah',
        lastName: 'Jones',
        employeeId: 'EMP-TEST-004',
        department: 'HR',
        designation: 'HR Executive',
        baseSalary: 45000,
        allowances: { hra: 9000, transport: 1500 },
        deductions: { pf: 3000, tax: 4500, insurance: 1000 },
        workingDays: 15, // Many absences - edge case
        lateDays: 2,
        absentDays: 7,
        overtimeHours: 0
      },
      {
        email: 'test.negative@test.com',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'Negative',
        employeeId: 'EMP-TEST-005',
        department: 'Testing',
        designation: 'QA Tester',
        baseSalary: 40000,
        allowances: { hra: 8000 },
        deductions: { pf: 3000, tax: 4000, loan: 10000 }, // High deductions
        workingDays: 5, // Very few working days - should result in 0, not negative
        lateDays: 1,
        absentDays: 17,
        overtimeHours: 0
      }
    ];

    const createdEmployees = [];

    for (const empData of dummyEmployees) {
      console.log(`👤 Creating employee: ${empData.firstName} ${empData.lastName}...`);
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: empData.email }
      });

      if (!user) {
        // Hash password
        const hashedPassword = await bcrypt.hash(empData.password, 10);

        // Create user
        user = await prisma.user.create({
          data: {
            email: empData.email,
            password: hashedPassword,
            role: 'EMPLOYEE',
            isActive: true
          }
        });
        console.log(`   ✅ User created: ${empData.email}`);
      } else {
        console.log(`   ℹ️  User already exists: ${empData.email}`);
      }

      // Check if employee already exists
      let employee = await prisma.employee.findUnique({
        where: { userId: user.id }
      });

      if (!employee) {
        // Create employee
        employee = await prisma.employee.create({
          data: {
            userId: user.id,
            employeeId: empData.employeeId,
            firstName: empData.firstName,
            lastName: empData.lastName,
            dateOfBirth: new Date('1990-01-01'),
            gender: 'MALE',
            phone: `+91-98765-${Math.floor(10000 + Math.random() * 90000)}`,
            address: '123 Test Street, Test City',
            department: empData.department,
            designation: empData.designation,
            joiningDate: new Date('2023-01-01'),
            baseSalary: empData.baseSalary,
            allowances: empData.allowances,
            deductions: empData.deductions
          }
        });
        console.log(`   ✅ Employee created: ${empData.employeeId}`);
      } else {
        console.log(`   ℹ️  Employee already exists: ${empData.employeeId}`);
      }

      createdEmployees.push({
        ...empData,
        employee,
        user
      });
    }

    console.log('\n📊 Creating attendance records...\n');

    // Create attendance records for the current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    const totalDaysInMonth = endDate.getDate();

    for (const empData of createdEmployees) {
      console.log(`📅 Creating attendance for ${empData.firstName} ${empData.lastName}...`);
      
      let workingDaysCreated = 0;
      let lateDaysCreated = 0;
      let absentDaysCreated = 0;
      let overtimeHoursAdded = 0;

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = currentDate.getDay();

        // Skip Sundays (0)
        if (dayOfWeek === 0) continue;

        // Check if attendance already exists
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            employeeId: empData.employee.id,
            date: currentDate
          }
        });

        if (existingAttendance) {
          console.log(`   ⏭️  Attendance already exists for ${currentDate.toDateString()}`);
          continue;
        }

        let status = 'PRESENT';
        let checkIn = new Date(currentDate);
        checkIn.setHours(9, 0, 0, 0);
        let checkOut = new Date(currentDate);
        checkOut.setHours(18, 0, 0, 0);
        let totalHours = 9;
        let overtimeHours = 0;

        // Determine status based on employee data
        if (absentDaysCreated < empData.absentDays) {
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
          totalHours = 0;
          absentDaysCreated++;
        } else if (workingDaysCreated < empData.workingDays) {
          if (lateDaysCreated < empData.lateDays && Math.random() > 0.5) {
            status = 'LATE';
            checkIn.setHours(10, 30, 0, 0); // Late by 1.5 hours
            totalHours = 7.5;
            lateDaysCreated++;
          } else {
            status = 'PRESENT';
            // Add overtime for some days
            if (overtimeHoursAdded < empData.overtimeHours && Math.random() > 0.7) {
              const dailyOvertime = Math.min(3, empData.overtimeHours - overtimeHoursAdded);
              overtimeHours = dailyOvertime;
              checkOut.setHours(18 + dailyOvertime, 0, 0, 0);
              totalHours = 9 + dailyOvertime;
              overtimeHoursAdded += dailyOvertime;
            }
          }
          workingDaysCreated++;
        } else {
          // Remaining days are absent
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
          totalHours = 0;
          absentDaysCreated++;
        }

        // Create attendance record
        await prisma.attendance.create({
          data: {
            employeeId: empData.employee.id,
            date: currentDate,
            status,
            checkIn,
            checkOut,
            totalHours,
            overtimeHours,
            notes: status === 'LATE' ? 'Late arrival' : null
          }
        });
      }

      console.log(`   ✅ Attendance created - Working: ${workingDaysCreated}, Late: ${lateDaysCreated}, Absent: ${absentDaysCreated}`);
    }

    console.log('\n💰 Generating payroll for dummy employees...\n');

    // Generate payroll for all dummy employees
    for (const empData of createdEmployees) {
      console.log(`💵 Calculating payroll for ${empData.firstName} ${empData.lastName}...`);

      // Check if payroll already exists
      const existingPayroll = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: empData.employee.id,
            month: currentMonth,
            year: currentYear
          }
        }
      });

      if (existingPayroll) {
        console.log(`   ℹ️  Payroll already exists, skipping...`);
        continue;
      }

      // Get attendance data
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: empData.employee.id,
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
      const baseSalary = parseFloat(empData.employee.baseSalary);
      const dailyRate = baseSalary / workingDaysInMonth;
      const hourlyRate = baseSalary / (workingDaysInMonth * 9);

      let calculatedBaseSalary = 0;
      if (totalWorkingDays > 0) {
        calculatedBaseSalary = dailyRate * totalWorkingDays;
        calculatedBaseSalary -= (dailyRate * 0.5 * halfDays);
      }

      const overtimePay = overtimeHours * hourlyRate * 1.5;
      const lateDeduction = lateDays * hourlyRate;

      const approvedLeaveDays = 0; // No leaves for dummy data
      const absentDays = Math.max(0, workingDaysInMonth - totalWorkingDays - approvedLeaveDays);
      const absentDeduction = absentDays * dailyRate;

      const allowances = empData.employee.allowances || {};
      const deductions = empData.employee.deductions || {};

      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      const grossSalary = calculatedBaseSalary + totalAllowances + overtimePay;
      const netSalary = Math.max(0, grossSalary - totalDeductions - lateDeduction - absentDeduction);

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: empData.employee.id,
          month: currentMonth,
          year: currentYear,
          baseSalary: empData.employee.baseSalary,
          allowances,
          deductions,
          overtimePay,
          leaveDeductions: 0,
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

      console.log(`   ✅ Payroll created:`);
      console.log(`      Base Salary: ₹${baseSalary.toFixed(2)}`);
      console.log(`      Calculated Base (${totalWorkingDays} days): ₹${calculatedBaseSalary.toFixed(2)}`);
      console.log(`      Allowances: ₹${totalAllowances.toFixed(2)}`);
      console.log(`      Overtime Pay: ₹${overtimePay.toFixed(2)}`);
      console.log(`      Gross Salary: ₹${grossSalary.toFixed(2)}`);
      console.log(`      Deductions: ₹${totalDeductions.toFixed(2)}`);
      console.log(`      Late Deduction (${lateDays} days): ₹${lateDeduction.toFixed(2)}`);
      console.log(`      Absent Deduction (${absentDays} days): ₹${absentDeduction.toFixed(2)}`);
      console.log(`      NET SALARY: ₹${netSalary.toFixed(2)}`);
      console.log('');
    }

    console.log('\n✅ Dummy payroll data added successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - ${createdEmployees.length} dummy employees created`);
    console.log(`   - Attendance records for month ${currentMonth}/${currentYear}`);
    console.log(`   - Payroll generated for all employees`);
    console.log('\n🔍 You can now check the admin dashboard to verify the monthly payroll calculation.');
    console.log('\n🗑️  To delete this dummy data later, run: node server/scripts/deleteDummyPayrollData.js\n');

  } catch (error) {
    console.error('❌ Error adding dummy payroll data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDummyPayrollData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
