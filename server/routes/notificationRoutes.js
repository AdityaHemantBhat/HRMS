const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.get('/announcements', getAnnouncements);
router.post('/announcements', authorize('ADMIN', 'HR'), createAnnouncement);
router.put('/announcements/:id', authorize('ADMIN', 'HR'), updateAnnouncement);
router.delete('/announcements/:id', authorize('ADMIN', 'HR'), deleteAnnouncement);

module.exports = router;
