import { useState, useEffect } from 'react';
import { Spin, Empty, message } from 'antd';
import { useTranslation } from 'react-i18next';

import { CommentWithReplies, commentService } from '../../services/commentService';
import { useAuthStore } from '../../stores/authStore';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import styles from './CommentSection.module.scss';

interface CommentSectionProps {
  postId: number;
  initialCount?: number;
}

const CommentSection = ({ postId, initialCount = 0 }: CommentSectionProps) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [total, setTotal] = useState(initialCount);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const fetchComments = async () => {
    try {
      const data = await commentService.getByPost(postId);
      setComments(data.comments);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCommentCreated = async () => {
    await fetchComments();
    setReplyingTo(null);
  };

  const handleCommentDeleted = async () => {
    await fetchComments();
  };

  const handleReply = (commentId: number) => {
    if (!isAuthenticated) {
      message.info(t('errors.unauthorized'));
      return;
    }
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  return (
    <div className={styles.commentSection}>
      <h2 className={styles.title}>
        {t('post.comments')}
        {total > 0 && <span className={styles.count}>({total})</span>}
      </h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <div className={styles.formWrapper}>
          <CommentForm
            postId={postId}
            onSuccess={handleCommentCreated}
          />
        </div>
      ) : (
        <div className={styles.loginPrompt}>
          <a href="/auth/login">{t('nav.login')}</a>
          {' '}{t('post.writeComment')}
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : comments.length === 0 ? (
        <Empty description={t('post.noComments')} />
      ) : (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              replyingTo={replyingTo}
              onReply={handleReply}
              onCommentCreated={handleCommentCreated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;


