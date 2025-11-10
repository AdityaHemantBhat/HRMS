const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// Helper function to generate random time within a range
function getRandomTime(baseHour, baseMinute, variationMinutes) {
  const totalMinutes = baseHour * 60 + baseMinute + Math.floor(Math.random() * variationMinutes * 2) - variationMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

// Helper function to calculate hours between two times
function calculateHours(checkIn, checkOut) {
  const diff = checkOut - checkIn;
  return (diff / (1000 * 60 * 60)).toFixed(2);
}

async function addDummyAttendanceData() {
  try {
    console.log('🚀 Starting to add dummy attendance data...\n');

    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (employees.length === 0) {
      console.log('❌ No employees found. Please add employees first.');
      return;
    }

    console.log(`📊 Found ${employees.length} employees\n`);

    // Generate attendance for the last 3 months including current month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2); // Go back 2 months
    startDate.setDate(1); // Start from 1st of that month

    console.log(`📅 Generating attendance from ${formatDate(startDate)} to ${formatDate(endDate)}\n`);

    let totalRecordsCreated = 0;
    let currentDate = new Date(startDate);

    // Loop through each day
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

      // Skip weekends
      if (!isWeekend) {
        for (const employee of employees) {
          // 90% attendance rate (10% chance of being absent)
          const isPresent = Math.random() > 0.1;

          if (isPresent) {
            // Check-in time: 9:00 AM ± 60 minutes (some late, some on time)
            const checkInTime = getRandomTime(9, 0, 60);
            const checkIn = new Date(currentDate);
            checkIn.setHours(checkInTime.hours, checkInTime.minutes, 0, 0);

            // Determine if late (after 9:30 AM)
            const isLate = checkInTime.hours > 9 || (checkInTime.hours === 9 && checkInTime.minutes > 30);

            // Check-out time: 6:00 PM ± 90 minutes
            const checkOutTime = getRandomTime(18, 0, 90);
            const checkOut = new Date(currentDate);
            checkOut.setHours(checkOutTime.hours, checkOutTime.minutes, 0, 0);

            // Calculate total hours
            const totalHours = parseFloat(calculateHours(checkIn, checkOut));
            const overtimeHours = Math.max(0, totalHours - 9);

            // Create attendance record
            try {
              await prisma.attendance.create({
                data: {
                  employeeId: employee.id,
                  date: new Date(formatDate(currentDate)),
                  checkIn: checkIn,
                  checkOut: checkOut,
                  status: isLate ? 'LATE' : 'PRESENT',
                  totalHours: totalHours,
                  overtimeHours: overtimeHours,
                  notes: isLate ? 'Late arrival' : null,
                },
              });

              // Add random breaks (tea and lunch)
              const attendanceRecord = await prisma.attendance.findUnique({
                where: {
                  employeeId_date: {
                    employeeId: employee.id,
                    date: new Date(formatDate(currentDate)),
                  },
                },
              });

              if (attendanceRecord) {
                // Tea break: 11:00 AM ± 30 minutes, duration 10-15 minutes
                const teaBreakStart = new Date(currentDate);
                const teaTime = getRandomTime(11, 0, 30);
                teaBreakStart.setHours(teaTime.hours, teaTime.minutes, 0, 0);
                const teaBreakEnd = new Date(teaBreakStart);
                teaBreakEnd.setMinutes(teaBreakEnd.getMinutes() + getRandomTime(0, 12, 3).minutes);

                await prisma.break.create({
                  data: {
                    attendanceId: attendanceRecord.id,
                    breakType: 'TEA',
                    startTime: teaBreakStart,
                    endTime: teaBreakEnd,
                    duration: Math.round((teaBreakEnd - teaBreakStart) / (1000 * 60)),
                  },
                });

                // Lunch break: 1:00 PM ± 30 minutes, duration 30-45 minutes
                const lunchBreakStart = new Date(currentDate);
                const lunchTime = getRandomTime(13, 0, 30);
                lunchBreakStart.setHours(lunchTime.hours, lunchTime.minutes, 0, 0);
                const lunchBreakEnd = new Date(lunchBreakStart);
                lunchBreakEnd.setMinutes(lunchBreakEnd.getMinutes() + getRandomTime(0, 37, 8).minutes);

                await prisma.break.create({
                  data: {
                    attendanceId: attendanceRecord.id,
                    breakType: 'LUNCH',
                    startTime: lunchBreakStart,
                    endTime: lunchBreakEnd,
                    duration: Math.round((lunchBreakEnd - lunchBreakStart) / (1000 * 60)),
                  },
                });
              }

              totalRecordsCreated++;
            } catch (error) {
              // Skip if record already exists (unique constraint)
              if (!error.message.includes('Unique constraint')) {
                console.error(`Error creating attendance for ${employee.firstName}: ${error.message}`);
              }
            }
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n✅ Successfully created ${totalRecordsCreated} attendance records!`);
    console.log(`📊 Coverage: ${employees.length} employees over ~${Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))} days`);
    console.log('\n💡 You can now view attendance reports in the system.');
    console.log('🗑️  To delete this dummy data, run: npm run delete-dummy-attendance\n');

  } catch (error) {
    console.error('❌ Error adding dummy attendance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDummyAttendanceData();
