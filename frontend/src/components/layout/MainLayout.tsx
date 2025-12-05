import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Spin } from 'antd';

import Header from './Header';
import Footer from './Footer';
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
    </div>
  );
};

export default MainLayout;

