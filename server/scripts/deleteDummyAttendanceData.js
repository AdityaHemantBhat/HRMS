const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteDummyAttendanceData() {
  try {
    console.log('🗑️  Delete Dummy Attendance Data\n');
    console.log('⚠️  WARNING: This will delete ALL attendance records and breaks from the database!\n');

    // Get counts
    const attendanceCount = await prisma.attendance.count();
    const breakCount = await prisma.break.count();

    console.log(`📊 Current database status:`);
    console.log(`   - Attendance records: ${attendanceCount}`);
    console.log(`   - Break records: ${breakCount}\n`);

    if (attendanceCount === 0) {
      console.log('✅ No attendance records found. Database is already clean.\n');
      rl.close();
      return;
    }

    // Ask for confirmation
    const answer = await askQuestion('❓ Are you sure you want to delete ALL attendance data? (yes/no): ');

    if (answer.toLowerCase() === 'yes') {
      console.log('\n🔄 Deleting attendance data...\n');

      // Delete breaks first (due to foreign key constraint)
      const deletedBreaks = await prisma.break.deleteMany({});
      console.log(`✅ Deleted ${deletedBreaks.count} break records`);

      // Delete attendance records
      const deletedAttendance = await prisma.attendance.deleteMany({});
      console.log(`✅ Deleted ${deletedAttendance.count} attendance records`);

      console.log('\n✅ All dummy attendance data has been deleted successfully!\n');
    } else {
      console.log('\n❌ Deletion cancelled. No data was removed.\n');
    }

  } catch (error) {
    console.error('❌ Error deleting dummy attendance data:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
deleteDummyAttendanceData();
