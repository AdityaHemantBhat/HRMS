const { prisma } = require('../config/database');
const { getPagination } = require('../utils/helpers');

// @desc    Get all goals
// @route   GET /api/performance/goals
// @access  Private
exports.getGoals = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;

    const where = {};

    // Employees can only see their own goals
    if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.employee.id;
    } else if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }

    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
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
// @route   GET /api/performance/goals/:id
// @access  Private
exports.getGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
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
// @route   POST /api/performance/goals
// @access  Private (Admin, HR, Team Lead)
exports.createGoal = async (req, res, next) => {
  try {
    const { employeeId, title, description, targetDate } = req.body;

    const goal = await prisma.goal.create({
      data: {
        employeeId: parseInt(employeeId),
        title,
        description,
        targetDate: new Date(targetDate)
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: goal.employee.user.id,
        type: 'TASK_ASSIGNED',
        title: 'New Goal Assigned',
        message: `You have been assigned a new goal: ${title}`,
        senderId: req.user.id,
        metadata: { goalId: goal.id }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal
// @route   PUT /api/performance/goals/:id
// @access  Private
exports.updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.targetDate) {
      updateData.targetDate = new Date(updateData.targetDate);
    }

    const goal = await prisma.goal.update({
      where: { id: parseInt(id) },
      data: updateData
    });

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
// @route   DELETE /api/performance/goals/:id
// @access  Private (Admin, HR, Team Lead)
exports.deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

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

// @desc    Get all feedback
// @route   GET /api/performance/feedback
// @access  Private
exports.getFeedback = async (req, res, next) => {
  try {
    const { employeeId } = req.query;

    const where = {};

    // Employees can only see feedback they received
    if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.employee.id;
    } else if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            designation: true
          }
        },
        giver: {
          select: {
            firstName: true,
            lastName: true,
            designation: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create feedback
// @route   POST /api/performance/feedback
// @access  Private
exports.createFeedback = async (req, res, next) => {
  try {
    const { employeeId, feedbackText, rating, category } = req.body;
    const giverId = req.user.employee.id;

    const feedback = await prisma.feedback.create({
      data: {
        employeeId: parseInt(employeeId),
        giverId,
        feedbackText,
        rating: rating ? parseInt(rating) : null,
        category
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                id: true
              }
            }
          }
        },
        giver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: feedback.employee.user.id,
        type: 'TASK_ASSIGNED',
        title: 'New Feedback Received',
        message: `You have received feedback from ${feedback.giver.firstName} ${feedback.giver.lastName}`,
        senderId: req.user.id,
        metadata: { feedbackId: feedback.id }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get performance statistics
// @route   GET /api/performance/stats/:employeeId
// @access  Private
exports.getPerformanceStats = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const empId = parseInt(employeeId);

    // Check access
    if (req.user.role === 'EMPLOYEE' && empId !== req.user.employee.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this data'
      });
    }

    const [
      totalGoals,
      completedGoals,
      inProgressGoals,
      avgFeedbackRating,
      totalTasksCompleted,
      totalHoursLogged
    ] = await Promise.all([
      prisma.goal.count({
        where: { employeeId: empId }
      }),
      prisma.goal.count({
        where: { employeeId: empId, status: 'COMPLETED' }
      }),
      prisma.goal.count({
        where: { employeeId: empId, status: 'IN_PROGRESS' }
      }),
      prisma.feedback.aggregate({
        where: { employeeId: empId, rating: { not: null } },
        _avg: { rating: true }
      }),
      prisma.taskLog.count({
        where: { employeeId: empId }
      }),
      prisma.taskLog.aggregate({
        where: { employeeId: empId },
        _sum: { hoursWorked: true }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        goals: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: inProgressGoals,
          completionRate: totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(2) : 0
        },
        feedback: {
          avgRating: avgFeedbackRating._avg.rating || 0
        },
        tasks: {
          totalCompleted: totalTasksCompleted,
          totalHours: totalHoursLogged._sum.hoursWorked || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
