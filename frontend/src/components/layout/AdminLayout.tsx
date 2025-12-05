import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CommentOutlined,
  UserOutlined,
  TagsOutlined,
  FolderOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

import styles from './AdminLayout.module.scss';

const { Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Dashboard</Link>,
    },
    {
      key: '/admin/posts',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/posts">Posts</Link>,
    },
    {
      key: '/admin/comments',
      icon: <CommentOutlined />,
      label: <Link to="/admin/comments">Comments</Link>,
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: <Link to="/admin/users">Users</Link>,
    },
    {
      key: '/admin/categories',
      icon: <FolderOutlined />,
      label: <Link to="/admin/categories">Categories</Link>,
    },
    {
      key: '/admin/tags',
      icon: <TagsOutlined />,
      label: <Link to="/admin/tags">Tags</Link>,
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Settings</Link>,
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/admin') return '/admin';
    return menuItems.find((item) => path.startsWith(item.key) && item.key !== '/admin')?.key || '/admin';
  };

  return (
    <Layout className={styles.adminLayout}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        className={styles.sider}
      >
        <div className={styles.logo}>
          <Link to="/admin">
            {collapsed ? 'AP' : 'Admin Panel'}
          </Link>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          className={styles.menu}
        />
        
        <div className={styles.backButton}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            block
          >
            {!collapsed && 'Back to Site'}
          </Button>
        </div>
      </Sider>
      
      <Layout>
        <header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.collapseButton}
          />
          <h1 className={styles.title}>Admin Panel</h1>
        </header>
        
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

