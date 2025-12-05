import { useState, useEffect } from 'react';
import { Button, Dropdown, message, Modal } from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { MenuProps } from 'antd';

import { CommentWithReplies, commentService } from '../../services/commentService';
import { likeService } from '../../services/likeService';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../common/UserAvatar';
import CommentForm from './CommentForm';
import CommentEditor from './CommentEditor';
import styles from './CommentItem.module.scss';

dayjs.extend(relativeTime);

interface CommentItemProps {
  comment: CommentWithReplies;
  postId: number;
  replyingTo: number | null;
  onReply: (commentId: number) => void;
  onCommentCreated: () => void;
  onCommentDeleted: () => void;
  depth?: number;
}

const MAX_DEPTH = 4; // Maximum nesting depth for display

const CommentItem = ({
  comment,
  postId,
  replyingTo,
  onReply,
  onCommentCreated,
  onCommentDeleted,
  depth = 0,
}: CommentItemProps) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  dayjs.locale(i18n.language === 'zh' ? 'zh-cn' : 'en');

  // Check initial like status
  useEffect(() => {
    if (isAuthenticated) {
      likeService.getStatus('comment', comment.id).then((status) => {
        setLiked(status.liked);
      }).catch(() => {});
    }
  }, [isAuthenticated, comment.id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      message.info('Please login to like');
      return;
    }
    try {
      const newLiked = await likeService.toggle('comment', comment.id, liked);
      setLiked(newLiked);
      setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    } catch (error) {
      message.error('Failed to update like');
    }
  };

  const isOwner = user?.id === comment.user_id;
  const isAdmin = user?.role === 'admin';
  const canModify = isOwner || isAdmin;

  const handleDelete = () => {
    Modal.confirm({
      title: t('common.confirm'),
      content: 'Are you sure you want to delete this comment?',
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await commentService.delete(comment.id);
          message.success('Comment deleted');
          onCommentDeleted();
        } catch (error) {
          message.error('Failed to delete comment');
        }
      },
    });
  };

  const handleEditSuccess = () => {
    setEditing(false);
    onCommentCreated();
  };

  const menuItems: MenuProps['items'] = canModify
    ? [
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: t('common.edit'),
          onClick: () => setEditing(true),
          disabled: comment.is_deleted,
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: t('common.delete'),
          onClick: handleDelete,
          danger: true,
        },
      ]
    : [];

  const showReplies = comment.replies && comment.replies.length > 0;
  const isReplying = replyingTo === comment.id;

  return (
    <div
      className={styles.commentItem}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, MAX_DEPTH) * 24}px` : 0 }}
    >
      <div className={styles.main}>
        <div className={styles.avatar}>
          <UserAvatar
            src={comment.user.avatar}
            username={comment.user.username}
            size={depth === 0 ? 40 : 32}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.author}>
              {comment.user.nickname || comment.user.username}
            </span>
            {comment.parent_id && depth === 0 && (
              <span className={styles.replyTo}>
                replied to a comment
              </span>
            )}
            <span className={styles.time}>
              {dayjs(comment.created_at).fromNow()}
            </span>
          </div>

          {editing ? (
            <CommentEditor
              initialContent={comment.content}
              commentId={comment.id}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className={styles.body}>
              {comment.is_deleted ? (
                <span className={styles.deleted}>[已删除]</span>
              ) : (
                <p>{comment.content_text || 'No content'}</p>
              )}
            </div>
          )}

          {!editing && !comment.is_deleted && (
            <div className={styles.actions}>
              <Button
                type="text"
                size="small"
                icon={liked ? <LikeFilled style={{ color: 'var(--accent-secondary)' }} /> : <LikeOutlined />}
                onClick={handleLike}
                className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
              >
                {likeCount > 0 && likeCount}
              </Button>
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined />}
                onClick={() => onReply(comment.id)}
                className={styles.actionBtn}
              >
                {t('post.comments').split(' ')[0]}
              </Button>
              {canModify && menuItems.length > 0 && (
                <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    className={styles.actionBtn}
                  />
                </Dropdown>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && isAuthenticated && (
            <div className={styles.replyForm}>
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={onCommentCreated}
                onCancel={() => onReply(comment.id)}
                placeholder={`Reply to ${comment.user.nickname || comment.user.username}...`}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              replyingTo={replyingTo}
              onReply={onReply}
              onCommentCreated={onCommentCreated}
              onCommentDeleted={onCommentDeleted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;

