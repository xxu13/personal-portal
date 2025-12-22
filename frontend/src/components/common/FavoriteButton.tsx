import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';

import { favoriteService } from '../../services/favoriteService';
import { useAuthStore } from '../../stores/authStore';
import styles from './FavoriteButton.module.scss';

interface FavoriteButtonProps {
  postId: number;
  initialFavorited?: boolean;
  size?: 'small' | 'middle' | 'large';
  onToggle?: (favorited: boolean) => void;
}

const FavoriteButton = ({
  postId,
  initialFavorited = false,
  size = 'middle',
  onToggle,
}: FavoriteButtonProps) => {
  const { isAuthenticated } = useAuthStore();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  // Fetch initial status if authenticated
  useEffect(() => {
    if (isAuthenticated && !initialFavorited) {
      favoriteService.getStatus(postId).then((status) => {
        setFavorited(status.favorited);
      }).catch(() => {});
    }
  }, [isAuthenticated, postId, initialFavorited]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      message.info('Please login to favorite');
      return;
    }

    setLoading(true);
    try {
      const newFavorited = await favoriteService.toggle(postId, favorited);
      setFavorited(newFavorited);
      onToggle?.(newFavorited);
      message.success(newFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      message.error('Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="text"
      size={size}
      icon={favorited ? <StarFilled className={styles.favorited} /> : <StarOutlined />}
      onClick={handleClick}
      loading={loading}
      className={`${styles.favoriteButton} ${favorited ? styles.active : ''}`}
    >
      {favorited ? 'Favorited' : 'Favorite'}
    </Button>
  );
};

export default FavoriteButton;


