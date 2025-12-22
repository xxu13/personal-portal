import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { authService } from '../../services/authService';
import styles from './AuthPage.module.scss';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    
    try {
      await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      
      message.success(t('auth.registerSuccess'));
      navigate('/auth/login');
    } catch (error: any) {
      // Error is handled by API interceptor
      console.error('Registration failed:', error);
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
            <h1 className={styles.authTitle}>{t('auth.register')}</h1>
            <p className={styles.authSubtitle}>{t('home.subtitle')}</p>
          </div>
          
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('auth.username') + ' is required' },
                { min: 3, message: 'Username must be at least 3 characters' },
                { max: 50, message: 'Username must be at most 50 characters' },
                { 
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: 'Username can only contain letters, numbers, underscores and hyphens',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className={styles.inputIcon} />}
                placeholder={t('auth.username')}
                className={styles.authInput}
              />
            </Form.Item>
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('auth.email') + ' is required' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles.inputIcon} />}
                placeholder={t('auth.email')}
                className={styles.authInput}
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.password') + ' is required' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={t('auth.password')}
                className={styles.authInput}
              />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('auth.confirmPassword') + ' is required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={t('auth.confirmPassword')}
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
                {t('auth.register')}
              </Button>
            </Form.Item>
          </Form>
          
          <div className={styles.authFooter}>
            <span>{t('auth.hasAccount')}</span>
            <Link to="/auth/login" className={styles.authLink}>
              {t('auth.login')}
            </Link>
          </div>
        </Card>
      </motion.div>
      
      {/* Background decoration */}
      <div className={styles.bgGlow} />
    </div>
  );
};

export default RegisterPage;



