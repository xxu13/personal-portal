/**
 * AI Floating Button Component
 * A floating action button that opens the AI tool modal
 */
import { RobotOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { useAIStore } from '../../stores/aiStore';
import { useIsAuthenticated } from '../../stores/authStore';
import styles from './AIFloatingButton.module.scss';

const AIFloatingButton = () => {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const { isModalOpen, openModal } = useAIStore();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleClick = () => {
    openModal();
  };

  return (
    <button
      className={`${styles.floatingButton} ${isModalOpen ? styles.hidden : ''}`}
      onClick={handleClick}
      aria-label={t('ai.openAI', '打开 AI 助手')}
    >
      <RobotOutlined className={styles.icon} />
      <span className={styles.tooltip}>
        {t('ai.openAI', 'AI 助手')}
      </span>
    </button>
  );
};

export default AIFloatingButton;

