import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spin, Empty, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Notification, notificationService } from '../../services/notificationService';
import { useNotificationStore } from '../../stores/notificationStore';
import UserAvatar from './UserAvatar';
import styles from './NotificationDropdown.module.scss';

dayjs.extend(relativeTime);

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadNotifications } = useNotificationStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications(1, 10);
        setNotifications(data.items);
        setUnreadNotifications(data.unread_count);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [setUnreadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.entity_type === 'post') {
      return `/posts/${notification.entity_id}`;
    }
    if (notification.entity_type === 'comment' && notification.data?.post_id) {
      return `/posts/${notification.data.post_id}`;
    }
    if (notification.entity_type === 'user' && notification.actor) {
      return `/user/${notification.actor.username}`;
    }
    return '/notifications';
  };

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={handleMarkAllRead}
        >
          Mark all read
        </Button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className={styles.list}>
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                onClick={onClose}
              >
                {notification.actor && (
                  <UserAvatar
                    src={notification.actor.avatar}
                    username={notification.actor.username}
                    size={32}
                  />
                )}
                <div className={styles.info}>
                  <div className={styles.itemTitle}>{notification.title}</div>
                  {notification.content && (
                    <div className={styles.itemContent}>{notification.content}</div>
                  )}
                  <div className={styles.time}>{dayjs(notification.created_at).fromNow()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/notifications" onClick={onClose}>
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;


