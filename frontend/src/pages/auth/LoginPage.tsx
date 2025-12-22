import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import styles from './AuthPage.module.scss';

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  
  // Get redirect URL from location state
  const from = (location.state as { from?: string })?.from || '/';
  
  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    
    try {
      const { user, token } = await authService.login({
        username: values.username,
        password: values.password,
      });
      
      login(user, token);
      message.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (error: any) {
      // Error is handled by API interceptor
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.authContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={styles.authCard} bordered={false}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>{t('auth.login')}</h1>
            <p className={styles.authSubtitle}>{t('home.welcome')}</p>
          </div>
          
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('auth.username') + ' is required' },
              ]}
            >
              <Input
                prefix={<UserOutlined className={styles.inputIcon} />}
                placeholder={t('auth.username')}
                className={styles.authInput}
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.password') + ' is required' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={t('auth.password')}
                className={styles.authInput}
              />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className={styles.authButton}
              >
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>
          
          <div className={styles.authFooter}>
            <span>{t('auth.noAccount')}</span>
            <Link to="/auth/register" className={styles.authLink}>
              {t('auth.register')}
            </Link>
          </div>
        </Card>
      </motion.div>
      
      {/* Background decoration */}
      <div className={styles.bgGlow} />
    </div>
  );
};

export default LoginPage;



