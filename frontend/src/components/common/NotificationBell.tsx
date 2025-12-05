import { useState, useEffect } from 'react';
import { Badge, Dropdown } from 'antd';
import { BellOutlined } from '@ant-design/icons';

import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import notificationService from '../../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import styles from './NotificationBell.module.scss';

const NotificationBell = () => {
  const { isAuthenticated } = useAuthStore();
  const { unreadNotifications, setUnreadNotifications } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch initial unread count
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getUnreadCount().then((count) => {
        setUnreadNotifications(count);
      }).catch(() => {});
    }
  }, [isAuthenticated, setUnreadNotifications]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => (
        <NotificationDropdown
          onClose={() => setDropdownOpen(false)}
        />
      )}
      placement="bottomRight"
      trigger={['click']}
    >
      <button className={styles.bellButton}>
        <Badge count={unreadNotifications} size="small" offset={[-2, 2]}>
          <BellOutlined className={styles.bellIcon} />
        </Badge>
      </button>
    </Dropdown>
  );
};

export default NotificationBell;

