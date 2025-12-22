import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect, forwardRef, useImperativeHandle } from 'react';

import EditorToolbar from './EditorToolbar';
import styles from './RichEditor.module.scss';

const lowlight = createLowlight(common);

export interface RichEditorRef {
  getEditor: () => Editor | null;
  getJSON: () => Record<string, any> | undefined;
  getHTML: () => string;
  setContent: (content: Record<string, any>) => void;
  clearContent: () => void;
}

interface RichEditorProps {
  content?: Record<string, any>;
  placeholder?: string;
  onChange?: (content: Record<string, any>) => void;
  editable?: boolean;
  minHeight?: string;
}

const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(
  ({ content, placeholder = 'Start writing...', onChange, editable = true, minHeight = '300px' }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        Image.configure({
          HTMLAttributes: {
            class: styles.editorImage,
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: styles.editorLink,
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: styles.codeBlock,
          },
        }),
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getJSON());
      },
    });

    useEffect(() => {
      if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getJSON: () => editor?.getJSON(),
      getHTML: () => editor?.getHTML() || '',
      setContent: (content: Record<string, any>) => {
        editor?.commands.setContent(content);
      },
      clearContent: () => {
        editor?.commands.clearContent();
      },
    }));

    if (!editor) {
      return null;
    }

    return (
      <div className={styles.editor}>
        {editable && <EditorToolbar editor={editor} />}
        <div className={styles.content} style={{ minHeight }}>
          <EditorContent editor={editor} className={styles.editorContent} />
        </div>
      </div>
    );
  }
);

RichEditor.displayName = 'RichEditor';

export default RichEditor;


