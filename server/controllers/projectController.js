const { prisma } = require('../config/database');
const { getPagination } = require('../utils/helpers');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {};
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  designation: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
              goals: true
            }
          },
          tasks: {
            select: {
              id: true,
              status: true
            }
          },
          goals: {
            select: {
              id: true,
              progress: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.project.count({ where })
    ]);

    // Calculate progress for each project based on goals (if any) or tasks
    const projectsWithProgress = projects.map(project => {
      let progress = 0;

      // Priority 1: Calculate from goals if they exist
      if (project.goals && project.goals.length > 0) {
        const totalGoalProgress = project.goals.reduce((sum, goal) => sum + goal.progress, 0);
        progress = Math.round(totalGoalProgress / project.goals.length);
      }
      // Priority 2: Calculate from tasks if no goals
      else if (project.tasks && project.tasks.length > 0) {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
        progress = Math.round((completedTasks / totalTasks) * 100);
      }

      return {
        ...project,
        progress,
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
        totalGoals: project.goals.length,
        completedGoals: project.goals.filter(g => g.status === 'COMPLETED').length
      };
    });

    res.status(200).json({
      success: true,
      count: projectsWithProgress.length,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: projectsWithProgress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                designation: true
              }
            }
          }
        },
        tasks: {
          include: {
            taskLogs: {
              include: {
                employee: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project with optional employee assignments
// @route   POST /api/projects
// @access  Private (Admin, HR, Team Lead)
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, employeeIds, priority, status } = req.body;

    // Create project with assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          name,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          priority: priority || 'MEDIUM',
          status: status || 'PLANNING'
        }
      });

      // If employeeIds provided, create assignments
      let assignments = [];
      if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
        assignments = await Promise.all(
          employeeIds.map(employeeId =>
            tx.projectAssignment.create({
              data: {
                projectId: project.id,
                employeeId: parseInt(employeeId),
                role: 'MEMBER'
              },
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
              }
            })
          )
        );
      }

      return { project, assignments };
    });

    res.status(201).json({
      success: true,
      message: `Project created successfully${result.assignments.length > 0 ? ` with ${result.assignments.length} employee(s) assigned` : ''}`,
      data: {
        ...result.project,
        assignments: result.assignments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, HR, Team Lead)
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign employees to project (supports single or multiple)
// @route   POST /api/projects/:id/assign
// @access  Private (Admin, HR, Team Lead)
exports.assignEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeIds, role } = req.body; // Now accepts array of employeeIds

    // Support both single employeeId and array of employeeIds
    const employeeIdArray = Array.isArray(employeeIds) ? employeeIds : [employeeIds];

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get already assigned employees to avoid duplicates
    const existingAssignments = await prisma.projectAssignment.findMany({
      where: {
        projectId: parseInt(id),
        employeeId: {
          in: employeeIdArray.map(eid => parseInt(eid))
        }
      },
      select: {
        employeeId: true
      }
    });

    const alreadyAssignedIds = existingAssignments.map(a => a.employeeId);
    const newEmployeeIds = employeeIdArray.filter(eid => !alreadyAssignedIds.includes(parseInt(eid)));

    if (newEmployeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected employees are already assigned to this project'
      });
    }

    // Create assignments for new employees
    const assignments = await prisma.$transaction(
      newEmployeeIds.map(employeeId =>
        prisma.projectAssignment.create({
          data: {
            projectId: parseInt(id),
            employeeId: parseInt(employeeId),
            role: role || 'MEMBER'
          },
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
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${assignments.length} employee(s) assigned to project successfully`,
      data: assignments,
      skipped: alreadyAssignedIds.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove employee from project
// @route   DELETE /api/projects/:id/assign/:assignmentId
// @access  Private (Admin, HR, Team Lead)
exports.removeEmployee = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    await prisma.projectAssignment.delete({
      where: { id: parseInt(assignmentId) }
    });

    res.status(200).json({
      success: true,
      message: 'Employee removed from project'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks
// @route   GET /api/projects/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;

    const where = {};
    if (projectId) where.projectId = parseInt(projectId);
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            name: true
          }
        },
        taskLogs: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task and optionally assign to employees
// @route   POST /api/projects/tasks
// @access  Private (Admin, HR, Team Lead)
exports.createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, priority, estimatedHours, assignedTo } = req.body;

    const task = await prisma.task.create({
      data: {
        projectId: parseInt(projectId),
        title,
        description,
        priority: priority || 'MEDIUM',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        assignedTo: assignedTo ? parseInt(assignedTo) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/projects/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log time for task
// @route   POST /api/projects/tasks/:id/log
// @access  Private
exports.logTaskTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hoursWorked, date, notes } = req.body;
    const employeeId = req.user.employee.id;

    const taskLog = await prisma.taskLog.create({
      data: {
        taskId: parseInt(id),
        employeeId,
        hoursWorked: parseFloat(hoursWorked),
        date: date ? new Date(date) : new Date(),
        notes
      }
    });

    res.status(201).json({
      success: true,
      message: 'Time logged successfully',
      data: taskLog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my assigned projects
// @route   GET /api/projects/my-projects
// @access  Private (Employee)
exports.getMyProjects = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const { status } = req.query;

    const where = {
      employeeId
    };

    if (status) {
      where.project = {
        status
      };
    }

    const assignments = await prisma.projectAssignment.findMany({
      where,
      include: {
        project: {
          include: {
            _count: {
              select: {
                tasks: true,
                assignments: true,
                goals: true
              }
            },
            tasks: {
              select: {
                id: true,
                status: true
              }
            },
            goals: {
              select: {
                id: true,
                progress: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    // Calculate progress for each project based on goals (if any) or tasks
    const projectsWithProgress = assignments.map(assignment => {
      const project = assignment.project;
      let progress = 0;

      // Priority 1: Calculate from goals if they exist
      if (project.goals && project.goals.length > 0) {
        const totalGoalProgress = project.goals.reduce((sum, goal) => sum + goal.progress, 0);
        progress = Math.round(totalGoalProgress / project.goals.length);
      }
      // Priority 2: Calculate from tasks if no goals
      else if (project.tasks && project.tasks.length > 0) {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
        progress = Math.round((completedTasks / totalTasks) * 100);
      }

      return {
        ...assignment,
        project: {
          ...project,
          progress,
          totalTasks: project.tasks.length,
          completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
          totalGoals: project.goals.length,
          completedGoals: project.goals.filter(g => g.status === 'COMPLETED').length
        }
      };
    });

    res.status(200).json({
      success: true,
      count: projectsWithProgress.length,
      data: projectsWithProgress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my task logs
// @route   GET /api/projects/tasks/my-logs
// @access  Private
exports.getMyTaskLogs = async (req, res, next) => {
  try {
    const employeeId = req.user.employee.id;
    const { startDate, endDate } = req.query;

    const where = { employeeId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const taskLogs = await prisma.taskLog.findMany({
      where,
      include: {
        task: {
          include: {
            project: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: taskLogs.length,
      data: taskLogs
    });
  } catch (error) {
    next(error);
  }
};
