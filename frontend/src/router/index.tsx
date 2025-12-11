import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';

// Lazy load pages
const HomePage = lazy(() => import('../pages/home/HomePage'));
const PostListPage = lazy(() => import('../pages/posts/PostListPage'));
const PostDetailPage = lazy(() => import('../pages/posts/PostDetailPage'));
const WritePage = lazy(() => import('../pages/posts/WritePage'));
const TagListPage = lazy(() => import('../pages/tags/TagListPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const FavoritesPage = lazy(() => import('../pages/user/FavoritesPage'));
const MessagesPage = lazy(() => import('../pages/user/MessagesPage'));
const NotificationsPage = lazy(() => import('../pages/user/NotificationsPage'));

// AI pages
const AIToolPage = lazy(() => import('../pages/ai/AIToolPage'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/DashboardPage'));
const AdminPosts = lazy(() => import('../pages/admin/PostManagePage'));
const AdminComments = lazy(() => import('../pages/admin/CommentManagePage'));
const AdminUsers = lazy(() => import('../pages/admin/UserManagePage'));
const AdminCategories = lazy(() => import('../pages/admin/CategoryManagePage'));
const AdminTags = lazy(() => import('../pages/admin/TagManagePage'));
const AdminSettings = lazy(() => import('../pages/admin/SettingsPage'));

// Page loading component
const PageLoading = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  }}>
    <Spin size="large" />
  </div>
);

// Root layout
const RootLayout = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
    <Suspense fallback={<PageLoading />}>
      <Outlet />
    </Suspense>
  </div>
);

// Auth layout
const AuthLayout = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
  }}>
    <Outlet />
  </div>
);

// Placeholder page for unimplemented features
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    color: 'var(--text-secondary)',
    padding: '2rem',
  }}>
    <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h2>
    <p>This feature will be implemented in a future module.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Main layout routes
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'posts',
            element: <PostListPage />,
          },
          {
            path: 'posts/:id',
            element: <PostDetailPage />,
          },
          {
            path: 'tags',
            element: <TagListPage />,
          },
          {
            path: 'categories/:slug',
            element: <PostListPage />,
          },
          {
            path: 'user/:username',
            element: <PlaceholderPage title="User Profile" />,
          },

          // Protected routes
          {
            element: <PrivateRoute />,
            children: [
              {
                path: 'write',
                element: <WritePage />,
              },
              {
                path: 'edit/:id',
                element: <WritePage />,
              },
              {
                path: 'user/profile',
                element: <PlaceholderPage title="My Profile" />,
              },
              {
                path: 'user/settings',
                element: <PlaceholderPage title="Settings" />,
              },
              {
                path: 'user/favorites',
                element: <FavoritesPage />,
              },
              {
                path: 'messages',
                element: <MessagesPage />,
              },
              {
                path: 'notifications',
                element: <NotificationsPage />,
              },
              {
                path: 'ai',
                element: <AIToolPage />,
              },
            ],
          },

        ],
      },

      // Admin routes (with AdminLayout)
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboard />,
              },
              {
                path: 'posts',
                element: <AdminPosts />,
              },
              {
                path: 'comments',
                element: <AdminComments />,
              },
              {
                path: 'users',
                element: <AdminUsers />,
              },
              {
                path: 'categories',
                element: <AdminCategories />,
              },
              {
                path: 'tags',
                element: <AdminTags />,
              },
              {
                path: 'settings',
                element: <AdminSettings />,
              },
            ],
          },
        ],
      },

      // Auth routes (without main layout)
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'register',
            element: <RegisterPage />,
          },
        ],
      },

      // 404 page
      {
        path: '*',
        element: (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: 'var(--text-primary)',
          }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '16px' }}>404</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
          </div>
        ),
      },
    ],
  },
]);


