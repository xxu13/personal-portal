import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination, Spin, Empty, Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { Favorite, favoriteService } from '../../services/favoriteService';
import GlassCard from '../../components/common/GlassCard';
import styles from './FavoritesPage.module.scss';

const FavoritesPage = () => {
  useTranslation(); // For locale
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const size = 20;

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoriteService.getMyFavorites(page, size);
      setFavorites(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const handleRemove = async (favoriteId: number) => {
    try {
      await favoriteService.delete(favoriteId);
      message.success('Removed from favorites');
      fetchFavorites();
    } catch (error) {
      message.error('Failed to remove');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.favoritesPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>My Favorites</h1>

        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : favorites.length === 0 ? (
          <Empty
            description="No favorites yet"
            className={styles.empty}
          >
            <Link to="/posts">
              <Button type="primary">Browse Posts</Button>
            </Link>
          </Empty>
        ) : (
          <>
            <div className={styles.list}>
              {favorites.map((favorite) => (
                <GlassCard key={favorite.id} className={styles.item}>
                  <div className={styles.content}>
                    {favorite.post?.cover_image && (
                      <div className={styles.cover}>
                        <img src={favorite.post.cover_image} alt="" />
                      </div>
                    )}
                    <div className={styles.info}>
                      <Link
                        to={`/posts/${favorite.post?.slug}`}
                        className={styles.postTitle}
                      >
                        {favorite.post?.title || 'Deleted Post'}
                      </Link>
                      {favorite.post?.excerpt && (
                        <p className={styles.excerpt}>{favorite.post.excerpt}</p>
                      )}
                      <div className={styles.meta}>
                        <span className={styles.time}>
                          Saved {dayjs(favorite.created_at).format('YYYY-MM-DD')}
                        </span>
                        {favorite.note && (
                          <span className={styles.note}>{favorite.note}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(favorite.id)}
                      className={styles.removeBtn}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

            {total > size && (
              <div className={styles.pagination}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={size}
                  onChange={handlePageChange}
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

export default FavoritesPage;

