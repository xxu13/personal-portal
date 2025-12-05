import { Editor } from '@tiptap/react';
import { Button, Tooltip, Divider, message } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  MinusOutlined,
} from '@ant-design/icons';

import { uploadService } from '../../services/uploadService';
import styles from './EditorToolbar.module.scss';

interface EditorToolbarProps {
  editor: Editor;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await uploadService.uploadImage(file);
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch (error) {
        message.error('Failed to upload image');
      }
    };
    input.click();
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <Tooltip title="Bold (Ctrl+B)">
          <Button
            type="text"
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? styles.active : ''}
          />
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <Button
            type="text"
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? styles.active : ''}
          />
        </Tooltip>
        <Tooltip title="Strikethrough">
          <Button
            type="text"
            icon={<StrikethroughOutlined />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? styles.active : ''}
          />
        </Tooltip>
      </div>

      <Divider type="vertical" className={styles.divider} />

      <div className={styles.group}>
        <Tooltip title="Heading 1">
          <Button
            type="text"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
          >
            H1
          </Button>
        </Tooltip>
        <Tooltip title="Heading 2">
          <Button
            type="text"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
          >
            H2
          </Button>
        </Tooltip>
        <Tooltip title="Heading 3">
          <Button
            type="text"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
          >
            H3
          </Button>
        </Tooltip>
      </div>

      <Divider type="vertical" className={styles.divider} />

      <div className={styles.group}>
        <Tooltip title="Bullet List">
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? styles.active : ''}
          />
        </Tooltip>
        <Tooltip title="Ordered List">
          <Button
            type="text"
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? styles.active : ''}
          />
        </Tooltip>
      </div>

      <Divider type="vertical" className={styles.divider} />

      <div className={styles.group}>
        <Tooltip title="Code Block">
          <Button
            type="text"
            icon={<CodeOutlined />}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? styles.active : ''}
          />
        </Tooltip>
        <Tooltip title="Blockquote">
          <Button
            type="text"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? styles.active : ''}
          >
            &ldquo;
          </Button>
        </Tooltip>
        <Tooltip title="Horizontal Rule">
          <Button
            type="text"
            icon={<MinusOutlined />}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </Tooltip>
      </div>

      <Divider type="vertical" className={styles.divider} />

      <div className={styles.group}>
        <Tooltip title="Add Link">
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={handleLink}
            className={editor.isActive('link') ? styles.active : ''}
          />
        </Tooltip>
        <Tooltip title="Upload Image">
          <Button
            type="text"
            icon={<PictureOutlined />}
            onClick={handleImageUpload}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default EditorToolbar;

