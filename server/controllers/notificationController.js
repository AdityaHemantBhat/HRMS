const { prisma } = require('../config/database');
const { getPagination } = require('../utils/helpers');

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const { skip, take } = getPagination(page, limit);
    const userId = req.user.id;

    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
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
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });

    res.status(200).json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements
// @route   GET /api/notifications/announcements
// @access  Private
exports.getAnnouncements = async (req, res, next) => {
  try {
    const where = { isActive: true };

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter by user role if targetRoles is specified
    const filteredAnnouncements = announcements.filter(announcement => {
      if (!announcement.targetRoles) return true;
      const targetRoles = Array.isArray(announcement.targetRoles) 
        ? announcement.targetRoles 
        : JSON.parse(announcement.targetRoles);
      return targetRoles.includes(req.user.role);
    });

    res.status(200).json({
      success: true,
      count: filteredAnnouncements.length,
      data: filteredAnnouncements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement
// @route   POST /api/notifications/announcements
// @access  Private (Admin, HR)
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, targetRoles } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        targetRoles: targetRoles || null
      }
    });

    // Create notifications for all users (or targeted roles)
    let users;
    if (targetRoles && targetRoles.length > 0) {
      users = await prisma.user.findMany({
        where: {
          role: { in: targetRoles },
          isActive: true
        }
      });
    } else {
      users = await prisma.user.findMany({
        where: { isActive: true }
      });
    }

    await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ANNOUNCEMENT',
            title: title,
            message: content,
            senderId: req.user.id,
            metadata: { announcementId: announcement.id }
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created and broadcasted',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement
// @route   PUT /api/notifications/announcements/:id
// @access  Private (Admin, HR)
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const announcement = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Announcement updated',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/notifications/announcements/:id
// @access  Private (Admin, HR)
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted'
    });
  } catch (error) {
    next(error);
  }
};
