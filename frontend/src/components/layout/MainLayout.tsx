import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Spin } from 'antd';

import Header from './Header';
import Footer from './Footer';
import AIToolModal from '../common/AIToolModal';
import AIFloatingButton from '../common/AIFloatingButton';
import styles from './MainLayout.module.scss';

const PageLoading = () => (
  <div className={styles.pageLoading}>
    <Spin size="large" />
  </div>
);

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      
      {/* AI Tool Components */}
      <AIToolModal />
      <AIFloatingButton />
    </div>
  );
};

export default MainLayout;


