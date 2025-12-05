import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';

import { router } from './router';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { changeLanguage } from './i18n';
import { authService } from './services/authService';

// Ant Design theme configuration
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Colors
    colorPrimary: '#6366f1',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // Background colors
    colorBgContainer: '#12121a',
    colorBgElevated: '#1a1a2e',
    colorBgLayout: '#0a0a0f',
    colorBgSpotlight: '#1e1e2d',
    
    // Text colors
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorTextQuaternary: '#475569',
    
    // Border colors
    colorBorder: '#2d2d3a',
    colorBorderSecondary: '#3d3d4a',
    
    // Typography
    fontFamily: "'IBM Plex Sans', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    
    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    
    // Shadows
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  },
  components: {
    Button: {
      primaryShadow: '0 0 0 rgba(0, 0, 0, 0)',
    },
    Card: {
      colorBgContainer: '#12121a',
    },
    Modal: {
      colorBgElevated: '#1a1a2e',
    },
    Dropdown: {
      colorBgElevated: '#1a1a2e',
    },
    Select: {
      colorBgContainer: '#12121a',
      colorBgElevated: '#1a1a2e',
    },
    Input: {
      colorBgContainer: '#12121a',
    },
    Menu: {
      colorBgContainer: 'transparent',
      colorItemBg: 'transparent',
      colorItemBgSelected: 'rgba(99, 102, 241, 0.1)',
      colorItemTextSelected: '#6366f1',
    },
  },
};

// App loading screen
const AppLoading = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0f',
  }}>
    <Spin size="large" />
  </div>
);

function App() {
  const { i18n } = useTranslation();
  const locale = useUIStore((state) => state.locale);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [appReady, setAppReady] = useState(false);
  
  // Check authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        await authService.checkAuth();
      } catch {
        // Ignore errors - user is not authenticated
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    };
    
    initAuth();
  }, [setLoading]);
  
  // Sync i18n language with store
  useEffect(() => {
    if (i18n.language !== locale) {
      changeLanguage(locale);
    }
  }, [locale, i18n]);
  
  // Get Ant Design locale based on current language
  const antdLocale = locale === 'zh' ? zhCN : enUS;
  
  // Show loading screen while checking auth
  if (!appReady) {
    return (
      <ConfigProvider theme={darkTheme}>
        <AppLoading />
      </ConfigProvider>
    );
  }
  
  return (
    <ConfigProvider
      locale={antdLocale}
      theme={darkTheme}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
