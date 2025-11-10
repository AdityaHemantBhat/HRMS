const { prisma } = require('../config/database');

/**
 * Auto-link unlinked goals to matching projects
 * This runs periodically to ensure goals are linked
 * Also updates project status based on goal completion
 */
async function autoLinkGoals() {
  try {
    // Get all goals without a project link
    const unlinkedGoals = await prisma.goal.findMany({
      where: {
        projectId: null
      }
    });

    if (unlinkedGoals.length === 0) {
      return { linked: 0, total: 0 };
    }

    let linkedCount = 0;

    for (const goal of unlinkedGoals) {
      // Try to find matching project
      const matchingProject = await prisma.project.findFirst({
        where: {
          OR: [
            { name: goal.title },
            { name: { contains: goal.title } },
            { name: { contains: goal.title.split(' ')[0] } },
          ],
          assignments: {
            some: {
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
        linkedCount++;
        
        // Update project status based on all its goals
        await updateProjectStatus(matchingProject.id);
      }
    }

    return { linked: linkedCount, total: unlinkedGoals.length };
  } catch (error) {
    console.error('Error auto-linking goals:', error);
    return { linked: 0, total: 0, error: error.message };
  }
}

/**
 * Update project status based on its goals' progress
 */
async function updateProjectStatus(projectId) {
  try {
    const projectGoals = await prisma.goal.findMany({
      where: { projectId }
    });

    if (projectGoals.length === 0) return;

    // Calculate average progress
    const totalProgress = projectGoals.reduce((sum, g) => sum + g.progress, 0);
    const avgProgress = Math.round(totalProgress / projectGoals.length);
    
    // Determine status based on progress
    let newProjectStatus = null;
    
    if (avgProgress === 100) {
      // All goals at 100% = COMPLETED
      newProjectStatus = 'COMPLETED';
    } else if (avgProgress > 0) {
      // Any progress = IN_PROGRESS
      newProjectStatus = 'IN_PROGRESS';
    } else {
      // No progress = PLANNING
      newProjectStatus = 'PLANNING';
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: newProjectStatus }
    });
  } catch (error) {
    console.error('Error updating project status:', error);
  }
}

module.exports = { autoLinkGoals };
