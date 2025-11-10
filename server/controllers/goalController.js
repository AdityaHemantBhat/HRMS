const { prisma } = require('../config/database');

// Helper function to update project progress based on goals
const updateProjectProgress = async (projectId) => {
  if (!projectId) return;

  const goals = await prisma.goal.findMany({
    where: { projectId: parseInt(projectId) }
  });

  if (goals.length === 0) return;

  // Calculate average progress of all goals
  const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
  const averageProgress = Math.round(totalProgress / goals.length);

  // Don't update the project itself, just return the calculated progress
  // The frontend will display this
  return averageProgress;
};

// @desc    Get my goals
// @route   GET /api/goals
// @access  Private
exports.getMyGoals = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const { status } = req.query;

    const where = { employeeId };
    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: {
        targetDate: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all goals (Admin/HR/Team Lead)
// @route   GET /api/goals/all
// @access  Private (Admin, HR, Team Lead)
exports.getAllGoals = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;

    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true
          }
        }
      },
      orderBy: {
        targetDate: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
exports.getGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employee.id;
    const isManager = ['ADMIN', 'HR', 'TEAM_LEAD'].includes(req.user.role);

    const where = { id: parseInt(id) };
    if (!isManager) {
      where.employeeId = employeeId;
    }

    const goal = await prisma.goal.findFirst({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            designation: true
          }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res, next) => {
  try {
    const { title, description, targetDate, employeeId, projectId } = req.body;
    const userEmployeeId = req.user.employee.id;
    const isManager = ['ADMIN', 'HR', 'TEAM_LEAD'].includes(req.user.role);

    // Managers can create goals for others, employees can only create for themselves
    const goalEmployeeId = isManager && employeeId ? parseInt(employeeId) : userEmployeeId;

    // If projectId not provided, try to auto-match with existing projects
    let linkedProjectId = projectId ? parseInt(projectId) : null;
    
    if (!linkedProjectId && title) {
      // Try to find matching project by name
      const matchingProject = await prisma.project.findFirst({
        where: {
          OR: [
            { name: { contains: title, mode: 'insensitive' } },
            { 
              AND: [
                { name: { contains: title.split(' ')[0], mode: 'insensitive' } },
                description ? { description: { contains: description, mode: 'insensitive' } } : {}
              ]
            }
          ],
          assignments: {
            some: {
              employeeId: goalEmployeeId
            }
          }
        }
      });

      if (matchingProject) {
        linkedProjectId = matchingProject.id;
      }
    }

    const goal = await prisma.goal.create({
      data: {
        employeeId: goalEmployeeId,
        projectId: linkedProjectId,
        title,
        description,
        targetDate: new Date(targetDate),
        status: 'IN_PROGRESS',
        progress: 0
      },
      include: {
        project: true
      }
    });

    res.status(201).json({
      success: true,
      message: linkedProjectId ? 'Goal created and linked to project' : 'Goal created successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employee.id;
    const isManager = ['ADMIN', 'HR', 'TEAM_LEAD'].includes(req.user.role);

    // Check if goal exists and user has permission
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: parseInt(id),
        ...(isManager ? {} : { employeeId })
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or you do not have permission to update it'
      });
    }

    const updateData = { ...req.body };
    if (updateData.targetDate) {
      updateData.targetDate = new Date(updateData.targetDate);
    }

    // Ensure progress is between 0 and 100
    if (updateData.progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, parseInt(updateData.progress)));
    }

    // Auto-link to project if not already linked and title/description changed
    if (!existingGoal.projectId && (updateData.title || updateData.description)) {
      const searchTitle = updateData.title || existingGoal.title;
      const searchDescription = updateData.description || existingGoal.description;
      
      const matchingProject = await prisma.project.findFirst({
        where: {
          OR: [
            { name: searchTitle },
            { name: { contains: searchTitle } },
            { name: { contains: searchTitle.split(' ')[0] } },
          ],
          assignments: {
            some: {
              employeeId: existingGoal.employeeId
            }
          }
        }
      });

      if (matchingProject) {
        updateData.projectId = matchingProject.id;
      }
    }

    const goal = await prisma.goal.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        }
      }
    });

    // Auto-update project status based on goal progress
    if (goal.projectId) {
      const projectGoals = await prisma.goal.findMany({
        where: { projectId: goal.projectId }
      });

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
        where: { id: goal.projectId },
        data: { status: newProjectStatus }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employee.id;
    const isManager = ['ADMIN', 'HR', 'TEAM_LEAD'].includes(req.user.role);

    // Check if goal exists and user has permission
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: parseInt(id),
        ...(isManager ? {} : { employeeId })
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or you do not have permission to delete it'
      });
    }

    await prisma.goal.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
