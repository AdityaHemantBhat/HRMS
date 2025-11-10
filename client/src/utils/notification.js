import { notification } from 'antd';

// Configure notification globally
notification.config({
  placement: 'topRight',
  top: 24,
  duration: 3,
  maxCount: 3,
});

// Track recent notifications to prevent duplicates
const recentNotifications = new Map();
const DUPLICATE_THRESHOLD = 300; // ms

const showNotification = (type, content) => {
  // Prevent duplicate notifications
  const key = `${type}-${content}`;
  const now = Date.now();
  
  if (recentNotifications.has(key)) {
    const lastTime = recentNotifications.get(key);
    if (now - lastTime < DUPLICATE_THRESHOLD) {
      return; // Skip duplicate
    }
  }
  
  recentNotifications.set(key, now);
  
  // Clean up old entries
  setTimeout(() => recentNotifications.delete(key), DUPLICATE_THRESHOLD);
  
  // Show the notification - Ant Design will add the icon automatically
  notification[type]({
    message: content,
    placement: 'topRight',
    duration: 3,
    className: `custom-toast-${type}`,
  });
};

// Export message-like API
export const message = {
  success: (content) => showNotification('success', content),
  error: (content) => showNotification('error', content),
  warning: (content) => showNotification('warning', content),
  info: (content) => showNotification('info', content),
};

export default message;
