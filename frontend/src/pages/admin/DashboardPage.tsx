import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  TagsOutlined,
  FolderOutlined,
  RiseOutlined,
} from '@ant-design/icons';

import { DashboardStats, adminService } from '../../services/adminService';
import styles from './DashboardPage.module.scss';

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load statistics</div>;
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Link to="/admin/users">
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="Total Users"
                value={stats.users.total}
                prefix={<UserOutlined />}
                suffix={
                  stats.users.new_today > 0 && (
                    <span className={styles.suffix}>
                      +{stats.users.new_today} today
                    </span>
                  )
                }
              />
            </Card>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Link to="/admin/posts">
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="Total Posts"
                value={stats.posts.total}
                prefix={<FileTextOutlined />}
                suffix={
                  <span className={styles.suffix}>
                    {stats.posts.published} published
                  </span>
                }
              />
            </Card>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Link to="/admin/comments">
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="Total Comments"
                value={stats.comments.total}
                prefix={<CommentOutlined />}
              />
            </Card>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Link to="/admin/categories">
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="Categories"
                value={stats.categories}
                prefix={<FolderOutlined />}
              />
            </Card>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Link to="/admin/tags">
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="Tags"
                value={stats.tags}
                prefix={<TagsOutlined />}
              />
            </Card>
          </Link>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className={styles.statCard}>
            <Statistic
              title="Activity This Week"
              value={stats.posts.this_week}
              prefix={<RiseOutlined />}
              suffix={
                <span className={styles.suffix}>
                  posts / {stats.comments.this_week} comments
                </span>
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

