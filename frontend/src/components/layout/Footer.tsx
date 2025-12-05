import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import styles from './Footer.module.scss';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              {t('common.appName')}
            </Link>
            <p className={styles.tagline}>{t('home.subtitle')}</p>
          </div>
          
          <nav className={styles.links}>
            <Link to="/" className={styles.link}>{t('nav.home')}</Link>
            <Link to="/posts" className={styles.link}>{t('nav.posts')}</Link>
            <Link to="/tags" className={styles.link}>{t('nav.tags')}</Link>
          </nav>
          
          <div className={styles.social}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <GithubOutlined />
            </a>
            <a
              href="mailto:contact@example.com"
              className={styles.socialLink}
              aria-label="Email"
            >
              <MailOutlined />
            </a>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} {t('common.appName')}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

