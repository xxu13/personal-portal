import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination, Spin, Empty, Button, Switch } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Notification, notificationService } from '../../services/notificationService';
import { useNotificationStore } from '../../stores/notificationStore';
import UserAvatar from '../../components/common/UserAvatar';
import GlassCard from '../../components/common/GlassCard';
import styles from './NotificationsPage.module.scss';

dayjs.extend(relativeTime);

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { setUnreadNotifications } = useNotificationStore();
  const size = 20;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(page, size, unreadOnly);
      setNotifications(data.items);
      setTotal(data.total);
      setUnreadNotifications(data.unread_count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.entity_type === 'post') {
      return `/posts/${notification.entity_id}`;
    }
    if (notification.entity_type === 'comment' && notification.data?.post_id) {
      return `/posts/${notification.data.post_id}`;
    }
    return '#';
  };

  return (
    <div className={styles.notificationsPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
          <div className={styles.actions}>
            <div className={styles.filter}>
              <span>Unread only</span>
              <Switch checked={unreadOnly} onChange={setUnreadOnly} />
            </div>
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <>
            <div className={styles.list}>
              {notifications.map((notification) => (
                <GlassCard
                  key={notification.id}
                  className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                >
                  <Link
                    to={getNotificationLink(notification)}
                    className={styles.content}
                  >
                    {notification.actor && (
                      <UserAvatar
                        src={notification.actor.avatar}
                        username={notification.actor.username}
                        size={40}
                      />
                    )}
                    <div className={styles.info}>
                      <div className={styles.itemTitle}>{notification.title}</div>
                      {notification.content && (
                        <div className={styles.itemContent}>{notification.content}</div>
                      )}
                      <div className={styles.time}>
                        {dayjs(notification.created_at).fromNow()}
                      </div>
                    </div>
                  </Link>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(notification.id)}
                    className={styles.deleteBtn}
                  />
                </GlassCard>
              ))}
            </div>

            {total > size && (
              <div className={styles.pagination}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={size}
                  onChange={(p) => { setPage(p); window.scrollTo(0, 0); }}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

