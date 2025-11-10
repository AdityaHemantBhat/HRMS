const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Checking database status...');

    // Check if any users exist
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      console.log('⚠️  Database already contains data!');
      console.log(`   Found ${userCount} user(s) in the database.`);
      console.log('\n❌ SEED ABORTED - Database is not empty.');
      console.log('\n💡 This seed script only runs on an empty database.');
      console.log('   If you want to reset the database completely, run:');
      console.log('   npx prisma migrate reset\n');
      console.log('   ⚠️  WARNING: This will DELETE ALL DATA!\n');
      return;
    }

    console.log('✅ Database is empty, proceeding with initialization...');

    // Hash admin password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create Admin user ONLY
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        employee: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            employeeId: 'ADMIN001',
            designation: 'System Administrator',
            department: 'Administration',
            baseSalary: 0,
            allowances: {},
            deductions: {}
          }
        }
      },
      include: { employee: true }
    });

    console.log('✅ Created Admin user');

    // Initialize leave balance for admin
    const currentYear = new Date().getFullYear();
    const leaveTypes = ['SICK', 'CASUAL', 'PAID', 'EARNED'];
    const leaveQuotas = {
      SICK: 12,
      CASUAL: 12,
      PAID: 15,
      EARNED: 15
    };

    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: admin.employee.id,
          leaveType,
          totalLeaves: leaveQuotas[leaveType],
          usedLeaves: 0,
          remainingLeaves: leaveQuotas[leaveType],
          year: currentYear
        }
      });
    }

    console.log('✅ Initialized admin leave balance');

    console.log('\n🎉 Production database initialized successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email: admin@gmail.com');
    console.log('  Password: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the admin password immediately after first login!\n');
    console.log('📌 Next Steps:');
    console.log('  1. Login as admin');
    console.log('  2. Change admin password');
    console.log('  3. Create HR/Employee accounts as needed');
    console.log('  4. Configure departments and leave types');
    console.log('  5. Add holidays for the year\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
