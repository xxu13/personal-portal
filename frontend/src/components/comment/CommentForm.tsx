import { useState } from 'react';
import { Button, Input, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { commentService } from '../../services/commentService';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../common/UserAvatar';
import styles from './CommentForm.module.scss';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

const CommentForm = ({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder,
  compact = false,
}: CommentFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      // Create simple TipTap JSON content
      const tiptapContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: content.trim() }],
          },
        ],
      };

      await commentService.create({
        post_id: postId,
        content: tiptapContent,
        parent_id: parentId,
      });

      setContent('');
      message.success('Comment posted');
      onSuccess();
    } catch (error) {
      message.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.commentForm} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.avatar}>
          <UserAvatar
            src={user?.avatar}
            username={user?.username}
            size={40}
          />
        </div>
      )}
      <div className={styles.inputWrapper}>
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || t('post.writeComment')}
          autoSize={{ minRows: compact ? 2 : 3, maxRows: 6 }}
          className={styles.textarea}
        />
        <div className={styles.actions}>
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!content.trim()}
          >
            {t('common.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;

