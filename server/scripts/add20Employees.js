const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Generate realistic employee data
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Support'];
const designations = {
  Engineering: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'DevOps Engineer', 'QA Engineer'],
  Marketing: ['Marketing Manager', 'Content Writer', 'SEO Specialist', 'Social Media Manager'],
  Sales: ['Sales Executive', 'Business Development Manager', 'Account Manager'],
  HR: ['HR Manager', 'HR Executive', 'Recruiter'],
  Finance: ['Accountant', 'Finance Manager', 'Financial Analyst'],
  Operations: ['Operations Manager', 'Project Manager', 'Coordinator'],
  Design: ['UI/UX Designer', 'Graphic Designer', 'Product Designer'],
  Support: ['Customer Support Executive', 'Technical Support Engineer']
};

const firstNames = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Pooja',
  'Arjun', 'Divya', 'Karan', 'Neha', 'Sanjay', 'Kavya', 'Aditya', 'Riya',
  'Nikhil', 'Shreya', 'Varun', 'Meera'
];

const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Verma', 'Joshi',
  'Mehta', 'Nair', 'Rao', 'Desai', 'Iyer', 'Chopra', 'Malhotra', 'Kapoor',
  'Agarwal', 'Bansal', 'Shah', 'Kulkarni'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function add20Employees() {
  try {
    console.log('🚀 Starting to add 20 dummy employees with attendance...\n');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📅 Current Month: ${currentMonth}, Year: ${currentYear}\n`);

    const createdEmployees = [];

    // Create 20 employees
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
      const employeeId = `EMP${String(i + 1).padStart(3, '0')}`;
      const department = getRandomElement(departments);
      const designation = getRandomElement(designations[department]);
      
      // Salary range based on department
      const baseSalary = getRandomNumber(35000, 90000);
      
      // Random allowances
      const allowances = {
        hra: Math.floor(baseSalary * 0.2),
        transport: getRandomNumber(1500, 3000),
        medical: getRandomNumber(1000, 2500)
      };
      
      // Random deductions
      const deductions = {
        pf: Math.floor(baseSalary * 0.12),
        tax: Math.floor(baseSalary * 0.1),
        insurance: getRandomNumber(500, 1500)
      };

      // Random attendance pattern (realistic)
      const attendancePattern = getRandomNumber(1, 5);
      let workingDays, lateDays, absentDays, overtimeHours;
      
      if (attendancePattern === 1) {
        // Excellent attendance
        workingDays = getRandomNumber(21, 22);
        lateDays = getRandomNumber(0, 1);
        absentDays = 22 - workingDays;
        overtimeHours = getRandomNumber(5, 15);
      } else if (attendancePattern === 2) {
        // Good attendance
        workingDays = getRandomNumber(19, 21);
        lateDays = getRandomNumber(1, 3);
        absentDays = 22 - workingDays;
        overtimeHours = getRandomNumber(2, 8);
      } else if (attendancePattern === 3) {
        // Average attendance
        workingDays = getRandomNumber(17, 19);
        lateDays = getRandomNumber(2, 4);
        absentDays = 22 - workingDays;
        overtimeHours = getRandomNumber(0, 5);
      } else if (attendancePattern === 4) {
        // Below average attendance
        workingDays = getRandomNumber(14, 17);
        lateDays = getRandomNumber(3, 6);
        absentDays = 22 - workingDays;
        overtimeHours = 0;
      } else {
        // Poor attendance
        workingDays = getRandomNumber(10, 14);
        lateDays = getRandomNumber(2, 5);
        absentDays = 22 - workingDays;
        overtimeHours = 0;
      }

      console.log(`👤 Creating employee ${i + 1}/20: ${firstName} ${lastName}...`);
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'EMPLOYEE',
            isActive: true
          }
        });
        console.log(`   ✅ User created: ${email}`);
      } else {
        console.log(`   ℹ️  User already exists: ${email}`);
      }

      // Check if employee already exists
      let employee = await prisma.employee.findUnique({
        where: { userId: user.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            userId: user.id,
            employeeId,
            firstName,
            lastName,
            dateOfBirth: new Date(getRandomNumber(1985, 2000), getRandomNumber(0, 11), getRandomNumber(1, 28)),
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            phone: `+91-${getRandomNumber(70000, 99999)}-${getRandomNumber(10000, 99999)}`,
            address: `${getRandomNumber(1, 999)} Street, ${department} Colony, City`,
            department,
            designation,
            joiningDate: new Date(getRandomNumber(2020, 2024), getRandomNumber(0, 11), getRandomNumber(1, 28)),
            baseSalary,
            allowances,
            deductions
          }
        });
        console.log(`   ✅ Employee created: ${employeeId} - ${department} - ${designation}`);
      } else {
        console.log(`   ℹ️  Employee already exists: ${employeeId}`);
      }

      createdEmployees.push({
        firstName,
        lastName,
        employeeId,
        department,
        designation,
        baseSalary,
        allowances,
        deductions,
        workingDays,
        lateDays,
        absentDays,
        overtimeHours,
        employee,
        user
      });
    }

    console.log('\n📊 Creating attendance records for all employees...\n');

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

        // Skip Sundays
        if (dayOfWeek === 0) continue;

        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            employeeId: empData.employee.id,
            date: currentDate
          }
        });

        if (existingAttendance) continue;

        let status = 'PRESENT';
        let checkIn = new Date(currentDate);
        checkIn.setHours(9, 0, 0, 0);
        let checkOut = new Date(currentDate);
        checkOut.setHours(18, 0, 0, 0);
        let totalHours = 9;
        let overtimeHours = 0;

        if (absentDaysCreated < empData.absentDays) {
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
          totalHours = 0;
          absentDaysCreated++;
        } else if (workingDaysCreated < empData.workingDays) {
          if (lateDaysCreated < empData.lateDays && Math.random() > 0.5) {
            status = 'LATE';
            const lateMinutes = getRandomNumber(30, 120);
            checkIn.setHours(9, lateMinutes, 0, 0);
            totalHours = 9 - (lateMinutes / 60);
            lateDaysCreated++;
          } else {
            status = 'PRESENT';
            // Randomly add some variation to check-in time
            checkIn.setHours(9, getRandomNumber(0, 15), 0, 0);
            
            // Add overtime for some days
            if (overtimeHoursAdded < empData.overtimeHours && Math.random() > 0.6) {
              const dailyOvertime = Math.min(3, empData.overtimeHours - overtimeHoursAdded);
              overtimeHours = dailyOvertime;
              checkOut.setHours(18 + dailyOvertime, 0, 0, 0);
              totalHours = 9 + dailyOvertime;
              overtimeHoursAdded += dailyOvertime;
            } else {
              checkOut.setHours(18, getRandomNumber(0, 30), 0, 0);
            }
          }
          workingDaysCreated++;
        } else {
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
          totalHours = 0;
          absentDaysCreated++;
        }

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

      console.log(`   ✅ Attendance created - Working: ${workingDaysCreated}, Late: ${lateDaysCreated}, Absent: ${absentDaysCreated}, OT: ${overtimeHoursAdded}hrs`);
    }

    console.log('\n💰 Generating payroll for all employees...\n');

    let totalMonthlyPayroll = 0;

    for (const empData of createdEmployees) {
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
        console.log(`   ℹ️  Payroll already exists for ${empData.firstName} ${empData.lastName}, skipping...`);
        continue;
      }

      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: empData.employee.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

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

      const approvedLeaveDays = 0;
      const absentDays = Math.max(0, workingDaysInMonth - totalWorkingDays - approvedLeaveDays);
      const absentDeduction = absentDays * dailyRate;

      const allowances = empData.employee.allowances || {};
      const deductions = empData.employee.deductions || {};

      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      const grossSalary = calculatedBaseSalary + totalAllowances + overtimePay;
      const netSalary = Math.max(0, grossSalary - totalDeductions - lateDeduction - absentDeduction);

      await prisma.payroll.create({
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

      totalMonthlyPayroll += netSalary;
      console.log(`   💵 ${empData.firstName} ${empData.lastName}: Net Salary = ₹${netSalary.toFixed(2)}`);
    }

    console.log('\n✅ Successfully created 20 employees with attendance and payroll!\n');
    console.log('📋 Summary:');
    console.log(`   - 20 employees created across ${departments.length} departments`);
    console.log(`   - Attendance records for ${currentMonth}/${currentYear}`);
    console.log(`   - Payroll generated for all employees`);
    console.log(`   - Total Monthly Payroll: ₹${totalMonthlyPayroll.toFixed(2)}`);
    console.log('\n🔍 Check your admin dashboard to see the monthly payroll!');
    console.log('\n📝 All employees have password: Test@123');
    console.log('\n🗑️  When ready to delete, just let me know!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

add20Employees()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
