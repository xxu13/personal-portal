import { useState } from 'react';
import { Button, Input, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { commentService } from '../../services/commentService';
import styles from './CommentEditor.module.scss';

interface CommentEditorProps {
  commentId: number;
  initialContent: Record<string, any>;
  onSuccess: () => void;
  onCancel: () => void;
}

// Extract text from TipTap JSON
const extractText = (content: Record<string, any>): string => {
  if (!content) return '';
  
  const textParts: string[] = [];
  
  const traverse = (node: any) => {
    if (node.type === 'text') {
      textParts.push(node.text || '');
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(content);
  return textParts.join(' ');
};

const CommentEditor = ({
  commentId,
  initialContent,
  onSuccess,
  onCancel,
}: CommentEditorProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(extractText(initialContent));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const tiptapContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: content.trim() }],
          },
        ],
      };

      await commentService.update(commentId, { content: tiptapContent });
      message.success('Comment updated');
      onSuccess();
    } catch (error) {
      message.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.commentEditor}>
      <Input.TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 6 }}
        className={styles.textarea}
        autoFocus
      />
      <div className={styles.actions}>
        <Button
          icon={<CloseOutlined />}
          onClick={onCancel}
          disabled={submitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!content.trim()}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default CommentEditor;

