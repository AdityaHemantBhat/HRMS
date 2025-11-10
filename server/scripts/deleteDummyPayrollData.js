const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteDummyPayrollData() {
  try {
    console.log('🗑️  Starting to delete dummy payroll data...\n');

    // Find all dummy employees (those with test or company emails)
    const dummyUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@test.com' } },
          { email: { endsWith: '@company.com' } }
        ]
      },
      include: {
        employee: true
      }
    });

    console.log(`Found ${dummyUsers.length} dummy users to delete.\n`);

    let deletedPayrolls = 0;
    let deletedAttendances = 0;
    let deletedEmployees = 0;
    let deletedUsers = 0;

    for (const user of dummyUsers) {
      if (user.employee) {
        console.log(`🔍 Processing: ${user.employee.firstName} ${user.employee.lastName} (${user.email})`);

        // Delete payroll records
        const payrollResult = await prisma.payroll.deleteMany({
          where: { employeeId: user.employee.id }
        });
        deletedPayrolls += payrollResult.count;
        console.log(`   ✅ Deleted ${payrollResult.count} payroll record(s)`);

        // Delete attendance records
        const attendanceResult = await prisma.attendance.deleteMany({
          where: { employeeId: user.employee.id }
        });
        deletedAttendances += attendanceResult.count;
        console.log(`   ✅ Deleted ${attendanceResult.count} attendance record(s)`);

        // Delete leave records (if any)
        const leaveResult = await prisma.leave.deleteMany({
          where: { employeeId: user.employee.id }
        });
        if (leaveResult.count > 0) {
          console.log(`   ✅ Deleted ${leaveResult.count} leave record(s)`);
        }

        // Delete notifications for this user
        const notificationResult = await prisma.notification.deleteMany({
          where: { userId: user.id }
        });
        if (notificationResult.count > 0) {
          console.log(`   ✅ Deleted ${notificationResult.count} notification(s)`);
        }

        // Delete employee
        await prisma.employee.delete({
          where: { id: user.employee.id }
        });
        deletedEmployees++;
        console.log(`   ✅ Deleted employee record`);
      }

      // Delete user
      await prisma.user.delete({
        where: { id: user.id }
      });
      deletedUsers++;
      console.log(`   ✅ Deleted user account\n`);
    }

    console.log('✅ Dummy payroll data deleted successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - ${deletedUsers} user(s) deleted`);
    console.log(`   - ${deletedEmployees} employee(s) deleted`);
    console.log(`   - ${deletedAttendances} attendance record(s) deleted`);
    console.log(`   - ${deletedPayrolls} payroll record(s) deleted\n`);

  } catch (error) {
    console.error('❌ Error deleting dummy payroll data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteDummyPayrollData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
