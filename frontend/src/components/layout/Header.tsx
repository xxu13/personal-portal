import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, message } from 'antd';
import {
  MenuOutlined,
  EditOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  TranslationOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';

import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { authService } from '../../services/authService';
import { changeLanguage } from '../../i18n';
import UserAvatar from '../common/UserAvatar';
import NotificationBell from '../common/NotificationBell';
import styles from './Header.module.scss';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { locale, setLocale, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      logout();
      message.success(t('auth.logoutSuccess'));
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLanguageChange = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    setLocale(newLocale);
    changeLanguage(newLocale);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
      onClick: () => navigate('/user/settings'),
    },
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      icon: <DashboardOutlined />,
      label: t('nav.admin'),
      onClick: () => navigate('/admin'),
    }] : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
      disabled: loggingOut,
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <button
            className={styles.menuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <MenuOutlined />
          </button>
          
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>{t('common.appName')}</span>
          </Link>
          
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>{t('nav.home')}</Link>
            <Link to="/posts" className={styles.navLink}>{t('nav.posts')}</Link>
            <Link to="/tags" className={styles.navLink}>{t('nav.tags')}</Link>
          </nav>
        </div>
        
        <div className={styles.right}>
          <Button
            type="text"
            icon={<TranslationOutlined />}
            onClick={handleLanguageChange}
            className={styles.langButton}
          >
            {locale === 'zh' ? 'EN' : '中'}
          </Button>
          
          {isAuthenticated ? (
            <>
              <Link to="/write">
                <Button type="primary" icon={<EditOutlined />} className={styles.writeButton}>
                  {t('nav.write')}
                </Button>
              </Link>
              
              <NotificationBell />
              
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <button className={styles.userButton}>
                  <UserAvatar
                    src={user?.avatar}
                    username={user?.username}
                    size={32}
                  />
                </button>
              </Dropdown>
            </>
          ) : (
            <Space>
              <Link to="/auth/login">
                <Button type="text">{t('nav.login')}</Button>
              </Link>
              <Link to="/auth/register">
                <Button type="primary">{t('nav.register')}</Button>
              </Link>
            </Space>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.home')}
          </Link>
          <Link to="/posts" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.posts')}
          </Link>
          <Link to="/tags" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.tags')}
          </Link>
          {isAuthenticated && (
            <Link to="/write" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.write')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

