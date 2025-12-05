import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { LikeOutlined, LikeFilled } from '@ant-design/icons';

import { likeService, TargetType } from '../../services/likeService';
import { useAuthStore } from '../../stores/authStore';
import styles from './LikeButton.module.scss';

interface LikeButtonProps {
  targetType: TargetType;
  targetId: number;
  initialCount?: number;
  initialLiked?: boolean;
  size?: 'small' | 'middle' | 'large';
  showCount?: boolean;
  onToggle?: (liked: boolean, count: number) => void;
}

const LikeButton = ({
  targetType,
  targetId,
  initialCount = 0,
  initialLiked = false,
  size = 'middle',
  showCount = true,
  onToggle,
}: LikeButtonProps) => {
  const { isAuthenticated } = useAuthStore();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Fetch initial status if authenticated
  useEffect(() => {
    if (isAuthenticated && !initialLiked) {
      likeService.getStatus(targetType, targetId).then((status) => {
        setLiked(status.liked);
      }).catch(() => {});
    }
  }, [isAuthenticated, targetType, targetId, initialLiked]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      message.info('Please login to like');
      return;
    }

    setLoading(true);
    try {
      const newLiked = await likeService.toggle(targetType, targetId, liked);
      const newCount = newLiked ? count + 1 : count - 1;
      
      setLiked(newLiked);
      setCount(newCount);
      onToggle?.(newLiked, newCount);
    } catch (error) {
      message.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      size={size}
      icon={liked ? <LikeFilled className={styles.liked} /> : <LikeOutlined />}
      onClick={handleClick}
      loading={loading}
      className={`${styles.likeButton} ${liked ? styles.active : ''}`}
    >
      {showCount && count > 0 && <span className={styles.count}>{count}</span>}
    </Button>
  );
};

export default LikeButton;

