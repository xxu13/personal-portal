import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pagination, Spin, Empty, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { PostListItem } from '../../services/postService';
import postService from '../../services/postService';
import PostCard from '../../components/common/PostCard';
import Sidebar from '../../components/layout/Sidebar';
import styles from './PostListPage.module.scss';

const PostListPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const size = 12;
  const categoryId = searchParams.get('category_id');
  const tagId = searchParams.get('tag_id');
  const q = searchParams.get('q');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await postService.getList({
          page,
          size,
          category_id: categoryId ? parseInt(categoryId) : undefined,
          tag_id: tagId ? parseInt(tagId) : undefined,
          q: q || undefined,
        });
        setPosts(result.items);
        setTotal(result.total);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, categoryId, tagId, q]);

  const handlePageChange = (newPage: number) => {
    searchParams.set('page', String(newPage));
    setSearchParams(searchParams);
    window.scrollTo(0, 0);
  };

  const handleSearch = () => {
    if (searchValue) {
      searchParams.set('q', searchValue);
    } else {
      searchParams.delete('q');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t('nav.posts')}</h1>
            <Input
              placeholder={t('common.search')}
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              className={styles.searchInput}
              allowClear
            />
          </div>

          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : posts.length === 0 ? (
            <Empty description={t('post.noComments')} />
          ) : (
            <>
              <div className={styles.postsGrid}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
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
        </main>

        <aside className={styles.sidebar}>
          <Sidebar />
        </aside>
      </div>
    </div>
  );
};

export default PostListPage;


