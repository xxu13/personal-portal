/**
 * AI Tool Modal Component
 * Provides text-to-image generation and chat functionality
 */
import { useState, useRef, useEffect } from 'react';
import { Modal, Input, Select, Button, Checkbox, Segmented, Spin, message } from 'antd';
import {
  RobotOutlined,
  PictureOutlined,
  MessageOutlined,
  SendOutlined,
  SaveOutlined,
  PlusOutlined,
  ClearOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { useAIStore, AIMode } from '../../stores/aiStore';
import aiService, {
  ImageSize,
  IMAGE_SIZE_OPTIONS,
  IMAGE_COUNT_OPTIONS,
  Text2ImageResult,
  TaskStatus,
} from '../../services/aiService';
import styles from './AIToolModal.module.scss';

const { TextArea } = Input;

const AIToolModal = () => {
  const { t } = useTranslation();
  const {
    isModalOpen,
    mode,
    editorRef,
    onImageSelect,
    chatHistory,
    closeModal,
    setMode,
    addChatMessage,
    updateLastAssistantMessage,
    clearChatHistory,
  } = useAIStore();

  // Text-to-Image state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1024*1024');
  const [imageCount, setImageCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [results, setResults] = useState<Text2ImageResult[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom of chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset state when modal closes
  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    closeModal();
  };

  // ============================================================
  // Text-to-Image Handlers
  // ============================================================

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning(t('ai.enterPrompt', '请输入图片描述'));
      return;
    }

    setGenerating(true);
    setError(null);
    setResults([]);
    setSelectedImages(new Set());
    setTaskStatus('PENDING');

    try {
      // Submit task
      const taskResponse = await aiService.submitText2Image({
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        size: imageSize,
        n: imageCount,
      });

      // Poll until complete
      const statusResponse = await aiService.pollTaskUntilComplete(
        taskResponse.task_id,
        (status) => setTaskStatus(status),
        2000,
        90
      );

      if (statusResponse.status === 'SUCCEEDED' && statusResponse.results) {
        setResults(statusResponse.results);
        setTaskStatus('SUCCEEDED');
      } else {
        setError(statusResponse.message || t('ai.generateFailed', '生成失败'));
        setTaskStatus('FAILED');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.generateFailed', '生成失败'));
      setTaskStatus('FAILED');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSaveImages = async () => {
    if (selectedImages.size === 0) {
      message.warning(t('ai.selectImages', '请选择要保存的图片'));
      return;
    }

    setSaving(true);
    try {
      const selectedUrls = Array.from(selectedImages).map((i) => results[i].url);
      const savedImages = await Promise.all(
        selectedUrls.map((url) => aiService.saveImage(url))
      );

      message.success(t('ai.saveSuccess', `成功保存 ${savedImages.length} 张图片`));

      // Update results with local URLs
      const updatedResults = [...results];
      Array.from(selectedImages).forEach((index, i) => {
        updatedResults[index] = { url: savedImages[i].url };
      });
      setResults(updatedResults);
    } catch (err) {
      message.error(t('ai.saveFailed', '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleInsertImages = async () => {
    if (selectedImages.size === 0) {
      message.warning(t('ai.selectImages', '请选择要插入的图片'));
      return;
    }

    setSaving(true);
    try {
      // First save images if they're still external URLs
      const selectedUrls = Array.from(selectedImages).map((i) => results[i].url);
      const imagesToInsert: string[] = [];

      for (const url of selectedUrls) {
        if (url.startsWith('/uploads/')) {
          // Already saved locally
          imagesToInsert.push(url);
        } else {
          // Save first
          const saved = await aiService.saveImage(url);
          imagesToInsert.push(saved.url);
        }
      }

      // Insert into editor or call callback
      if (editorRef) {
        for (const url of imagesToInsert) {
          editorRef.chain().focus().setImage({ src: url }).run();
        }
        message.success(t('ai.insertSuccess', '已插入图片'));
      } else if (onImageSelect) {
        for (const url of imagesToInsert) {
          onImageSelect(url);
        }
      }

      handleClose();
    } catch (err) {
      message.error(t('ai.insertFailed', '插入失败'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Chat Handlers
  // ============================================================

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    // Add user message
    addChatMessage('user', userMessage);
    // Add empty assistant message for streaming
    addChatMessage('assistant', '');

    let accumulatedContent = '';

    abortControllerRef.current = aiService.chatStream(
      {
        message: userMessage,
        history: chatHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
      (content) => {
        accumulatedContent += content;
        updateLastAssistantMessage(accumulatedContent);
      },
      (error) => {
        message.error(error);
        setChatLoading(false);
      },
      () => {
        setChatLoading(false);
        abortControllerRef.current = null;
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearChatHistory();
    setChatLoading(false);
  };

  // ============================================================
  // Render
  // ============================================================

  const renderText2ImageSection = () => (
    <div className={styles.text2imageSection}>
      <div className={styles.promptInput}>
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('ai.promptPlaceholder', '描述你想要生成的图片，例如：一只可爱的猫咪在花园里玩耍')}
          autoSize={{ minRows: 3, maxRows: 6 }}
          disabled={generating}
        />
      </div>

      <div className={styles.optionsRow}>
        <div className={styles.optionItem}>
          <span className={styles.label}>{t('ai.imageSize', '图片尺寸')}</span>
          <Select
            value={imageSize}
            onChange={setImageSize}
            options={IMAGE_SIZE_OPTIONS}
            disabled={generating}
          />
        </div>
        <div className={styles.optionItem}>
          <span className={styles.label}>{t('ai.imageCount', '生成数量')}</span>
          <Select
            value={imageCount}
            onChange={setImageCount}
            options={IMAGE_COUNT_OPTIONS}
            disabled={generating}
          />
        </div>
        <Button
          type="primary"
          icon={<PictureOutlined />}
          onClick={handleGenerate}
          loading={generating}
          className={styles.generateBtn}
        >
          {generating ? t('ai.generating', '生成中...') : t('ai.generate', '生成')}
        </Button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
        </div>
      )}

      {(generating || results.length > 0) && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsTitle}>
            {generating
              ? t('ai.generatingStatus', `正在生成... (${taskStatus})`)
              : t('ai.generatedImages', '生成结果')}
          </div>

          {generating ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <span className={styles.loadingText}>
                {taskStatus === 'PENDING' && t('ai.statusPending', '排队中...')}
                {taskStatus === 'RUNNING' && t('ai.statusRunning', '正在生成...')}
              </span>
            </div>
          ) : (
            <>
              <div className={styles.imagesGrid}>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`${styles.imageCard} ${selectedImages.has(index) ? styles.selected : ''}`}
                    onClick={() => handleImageSelect(index)}
                  >
                    <Checkbox
                      checked={selectedImages.has(index)}
                      className={styles.checkbox}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleImageSelect(index)}
                    />
                    <img src={result.url} alt={`Generated ${index + 1}`} />
                    <div className={styles.overlay} />
                  </div>
                ))}
              </div>

              <div className={styles.actionsRow}>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveImages}
                  loading={saving}
                  className={styles.saveBtn}
                  disabled={selectedImages.size === 0}
                >
                  {t('ai.saveSelected', '保存选中')}
                </Button>
                {(editorRef || onImageSelect) && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleInsertImages}
                    loading={saving}
                    className={styles.insertBtn}
                    disabled={selectedImages.size === 0}
                  >
                    {t('ai.insertToArticle', '插入文章')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderChatSection = () => (
    <div className={styles.chatSection}>
      {chatHistory.length > 0 && (
        <Button
          type="text"
          icon={<ClearOutlined />}
          onClick={handleClearChat}
          className={styles.clearBtn}
        >
          {t('ai.clearChat', '清空对话')}
        </Button>
      )}

      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {chatHistory.length === 0 ? (
          <div className={styles.emptyChat}>
            <RobotOutlined className={styles.emptyIcon} />
            <span>{t('ai.startChat', '开始与 AI 助手对话')}</span>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${styles[msg.role]}`}
            >
              <div className={`${styles.messageAvatar} ${styles[msg.role]}`}>
                {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              </div>
              <div className={`${styles.messageContent} ${styles[msg.role]}`}>
                {msg.content || (chatLoading && index === chatHistory.length - 1 ? '...' : '')}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.chatInputRow}>
        <div className={styles.chatInput}>
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('ai.chatPlaceholder', '输入你的问题...')}
            disabled={chatLoading}
          />
        </div>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={chatLoading}
          className={styles.sendBtn}
        />
      </div>
    </div>
  );

  const modeOptions = [
    {
      label: (
        <span>
          <PictureOutlined /> {t('ai.text2image', '文生图')}
        </span>
      ),
      value: 'text2image' as AIMode,
    },
    {
      label: (
        <span>
          <MessageOutlined /> {t('ai.chat', '智能问答')}
        </span>
      ),
      value: 'chat' as AIMode,
    },
  ];

  return (
    <Modal
      open={isModalOpen}
      onCancel={handleClose}
      footer={null}
      width={720}
      className={styles.modal}
      destroyOnClose
      title={
        <div className={styles.header}>
          <div className={styles.title}>
            <RobotOutlined className={styles.icon} />
            {t('ai.title', 'AI 助手')}
          </div>
          <div className={styles.modeSwitch}>
            <Segmented
              value={mode}
              onChange={(value) => setMode(value as AIMode)}
              options={modeOptions}
            />
          </div>
        </div>
      }
    >
      {mode === 'text2image' ? renderText2ImageSection() : renderChatSection()}
    </Modal>
  );
};

export default AIToolModal;

