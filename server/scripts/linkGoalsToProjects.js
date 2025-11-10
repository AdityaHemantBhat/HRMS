const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkGoalsToProjects() {
  try {
    console.log('🔗 Starting to link goals to projects...\n');

    // Get all goals without a project link
    const unlinkedGoals = await prisma.goal.findMany({
      where: {
        projectId: null
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`Found ${unlinkedGoals.length} unlinked goals\n`);

    let linkedCount = 0;

    for (const goal of unlinkedGoals) {
      console.log(`\n📌 Processing goal: "${goal.title}"`);
      console.log(`   Employee: ${goal.employee.firstName} ${goal.employee.lastName}`);

      // Try to find matching project (MySQL doesn't support mode: insensitive)
      const matchingProject = await prisma.project.findFirst({
        where: {
          OR: [
            // Exact name match
            { name: goal.title },
            // Name contains goal title
            { name: { contains: goal.title } },
            // Goal title contains project name (first word)
            { name: { contains: goal.title.split(' ')[0] } },
          ],
          // Must be assigned to this employee
          assignments: {
            some: {
              employeeId: goal.employeeId
            }
          }
        },
        include: {
          assignments: {
            where: {
              employeeId: goal.employeeId
            }
          }
        }
      });

      if (matchingProject) {
        // Link the goal to the project
        await prisma.goal.update({
          where: { id: goal.id },
          data: { projectId: matchingProject.id }
        });

        console.log(`   ✅ Linked to project: "${matchingProject.name}"`);
        linkedCount++;
      } else {
        console.log(`   ⚠️  No matching project found`);
      }
    }

    console.log(`\n\n✅ Linking complete!`);
    console.log(`   Total goals processed: ${unlinkedGoals.length}`);
    console.log(`   Successfully linked: ${linkedCount}`);
    console.log(`   Not linked: ${unlinkedGoals.length - linkedCount}`);

  } catch (error) {
    console.error('❌ Error linking goals to projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkGoalsToProjects();
