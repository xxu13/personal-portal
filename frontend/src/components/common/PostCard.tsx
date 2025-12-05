import { Link } from 'react-router-dom';
import { EyeOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

import { PostListItem } from '../../services/postService';
import UserAvatar from './UserAvatar';
import CategoryBadge from './CategoryBadge';
import TagList from './TagList';
import GlassCard from './GlassCard';
import styles from './PostCard.module.scss';

dayjs.extend(relativeTime);

interface PostCardProps {
  post: PostListItem;
  showAuthor?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
}

const PostCard = ({
  post,
  showAuthor = true,
  showCategory = true,
  showTags = true,
}: PostCardProps) => {
  const { i18n } = useTranslation();
  
  // Set dayjs locale
  dayjs.locale(i18n.language === 'zh' ? 'zh-cn' : 'en');
  
  const displayTitle = i18n.language === 'en' && post.title_en ? post.title_en : post.title;
  const timeAgo = dayjs(post.published_at || post.created_at).fromNow();
  
  return (
    <GlassCard hoverable className={styles.postCard}>
      <Link to={`/posts/${post.slug}`} className={styles.cardLink}>
        {post.cover_image && (
          <div className={styles.coverWrapper}>
            <img src={post.cover_image} alt={displayTitle} className={styles.cover} />
            {post.is_featured && <span className={styles.featuredBadge}>Featured</span>}
          </div>
        )}
        
        <div className={styles.content}>
          {showCategory && post.category && (
            <CategoryBadge category={post.category} size="small" />
          )}
          
          <h3 className={styles.title}>{displayTitle}</h3>
          
          {post.excerpt && (
            <p className={styles.excerpt}>{post.excerpt}</p>
          )}
          
          {showTags && post.tags.length > 0 && (
            <TagList tags={post.tags} max={3} size="small" />
          )}
          
          <div className={styles.meta}>
            {showAuthor && (
              <div className={styles.author}>
                <UserAvatar
                  src={post.user.avatar}
                  username={post.user.username}
                  size={24}
                />
                <span className={styles.authorName}>
                  {post.user.nickname || post.user.username}
                </span>
              </div>
            )}
            
            <div className={styles.stats}>
              <span className={styles.stat}>
                <EyeOutlined /> {post.view_count}
              </span>
              <span className={styles.stat}>
                <LikeOutlined /> {post.like_count}
              </span>
              <span className={styles.stat}>
                <MessageOutlined /> {post.comment_count}
              </span>
            </div>
            
            <span className={styles.time}>{timeAgo}</span>
          </div>
        </div>
      </Link>
    </GlassCard>
  );
};

export default PostCard;

