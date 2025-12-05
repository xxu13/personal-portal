import React from 'react';
import ReactDOM from 'react-dom/client';
import { Suspense } from 'react';
import { Spin } from 'antd';

// Import i18n configuration (must be before App)
import './i18n';

// Import global styles
import './styles/global.scss';

// Import App component
import App from './App';

// Loading fallback for i18n
const I18nLoading = () => (
  <div 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#0a0a0f',
    }}
  >
    <Spin size="large" />
  </div>
);

// Mount the React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<I18nLoading />}>
      <App />
    </Suspense>
  </React.StrictMode>
);

