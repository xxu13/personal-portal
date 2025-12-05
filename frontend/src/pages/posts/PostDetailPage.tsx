import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, message } from 'antd';
import { CalendarOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { Post } from '../../services/postService';
import postService from '../../services/postService';
import UserAvatar from '../../components/common/UserAvatar';
import CategoryBadge from '../../components/common/CategoryBadge';
import TagList from '../../components/common/TagList';
import LikeButton from '../../components/common/LikeButton';
import FavoriteButton from '../../components/common/FavoriteButton';
import RichEditor from '../../components/editor/RichEditor';
import CommentSection from '../../components/comment/CommentSection';
import styles from './PostDetailPage.module.scss';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Try to parse as number for ID, otherwise treat as slug
        const postData = isNaN(Number(id))
          ? await postService.getBySlug(id)
          : await postService.getById(Number(id));
        setPost(postData);
      } catch (error) {
        message.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.notFound}>
        <h2>Post not found</h2>
        <Link to="/posts">Back to posts</Link>
      </div>
    );
  }

  const displayTitle = i18n.language === 'en' && post.title_en ? post.title_en : post.title;
  const displayContent = i18n.language === 'en' && post.content_en ? post.content_en : post.content;

  return (
    <div className={styles.pageContainer}>
      <article className={styles.article}>
        {post.cover_image && (
          <div className={styles.coverWrapper}>
            <img src={post.cover_image} alt={displayTitle} className={styles.cover} />
          </div>
        )}

        <header className={styles.header}>
          {post.category && (
            <CategoryBadge category={post.category} />
          )}
          
          <h1 className={styles.title}>{displayTitle}</h1>
          
          <div className={styles.meta}>
            <Link to={`/user/${post.user.username}`} className={styles.author}>
              <UserAvatar
                src={post.user.avatar}
                username={post.user.username}
                size={40}
              />
              <span className={styles.authorName}>
                {post.user.nickname || post.user.username}
              </span>
            </Link>
            
            <div className={styles.stats}>
              <span className={styles.stat}>
                <CalendarOutlined />
                {dayjs(post.published_at || post.created_at).format('YYYY-MM-DD')}
              </span>
              <span className={styles.stat}>
                <EyeOutlined /> {post.view_count}
              </span>
              <span className={styles.stat}>
                <MessageOutlined /> {post.comment_count}
              </span>
            </div>
            
            <div className={styles.actions}>
              <LikeButton
                targetType="post"
                targetId={post.id}
                initialCount={post.like_count}
              />
              <FavoriteButton postId={post.id} />
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <RichEditor content={displayContent} editable={false} />
        </div>

        {post.tags.length > 0 && (
          <footer className={styles.footer}>
            <TagList tags={post.tags} />
          </footer>
        )}
      </article>

      {/* Comments Section */}
      <section className={styles.comments}>
        <CommentSection postId={post.id} initialCount={post.comment_count} />
      </section>
    </div>
  );
};

export default PostDetailPage;

