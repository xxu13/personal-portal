import { NodeViewContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Select } from 'antd';
import styles from './CodeBlock.module.scss';

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash' },
  { value: 'markdown', label: 'Markdown' },
];

const CodeBlock = ({ node, updateAttributes }: NodeViewProps) => {
  return (
    <NodeViewWrapper className={styles.codeBlockWrapper}>
      <div className={styles.header}>
        <Select
          value={node.attrs.language || 'plaintext'}
          onChange={(value) => updateAttributes({ language: value })}
          options={languages}
          size="small"
          className={styles.languageSelect}
          popupClassName={styles.languageDropdown}
        />
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlock;

