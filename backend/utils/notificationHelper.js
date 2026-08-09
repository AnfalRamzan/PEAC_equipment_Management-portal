// src/utils/notificationHelper.js

export const isBrowserNotificationEnabled = () => {
    const saved = localStorage.getItem('browserNotifications');
    return saved !== null ? JSON.parse(saved) : true;
};

export const sendBrowserNotification = (title, body, icon = '/logo.png') => {
    if (!isBrowserNotificationEnabled()) return false;
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false;
    }
    
    try {
        const notification = new Notification(title, {
            body: body,
            icon: icon,
            silent: true,
            vibrate: [200, 100, 200]
        });
        setTimeout(() => notification.close(), 5000);
        return true;
    } catch(e) {
        return false;
    }
};