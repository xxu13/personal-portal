import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { PostListItem } from '../../services/postService';
import postService from '../../services/postService';
import PostCard from '../../components/common/PostCard';
import styles from './HomePage.module.scss';

const HomePage = () => {
  const { t } = useTranslation();
  const [featuredPosts, setFeaturedPosts] = useState<PostListItem[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, recent] = await Promise.all([
          postService.getFeatured(3),
          postService.getList({ page: 1, size: 6 }),
        ]);
        setFeaturedPosts(featured);
        setRecentPosts(recent.items);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('home.welcome')}
          </motion.h1>
          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('home.subtitle')}
          </motion.p>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/posts">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                {t('home.viewAll')}
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className={styles.heroGlow} />
      </section>

      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className={styles.section}>
              <div className={styles.container}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{t('home.featuredPosts')}</h2>
                  <Link to="/posts?featured=true" className={styles.viewAllLink}>
                    {t('home.viewAll')} <ArrowRightOutlined />
                  </Link>
                </div>
                <div className={styles.featuredGrid}>
                  {featuredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <section className={styles.section}>
              <div className={styles.container}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{t('home.recentPosts')}</h2>
                  <Link to="/posts" className={styles.viewAllLink}>
                    {t('home.viewAll')} <ArrowRightOutlined />
                  </Link>
                </div>
                <div className={styles.postsGrid}>
                  {recentPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;

