import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Input, Select, Button, Tag, Space, Popconfirm, message } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { AdminPost, adminService } from '../../services/adminService';
import styles from './ManagePage.module.scss';

const { Search } = Input;

const PostManagePage = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const size = 20;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPosts({
        page,
        size,
        search: search || undefined,
        status: statusFilter,
      });
      setPosts(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search, statusFilter]);

  const handleStatusChange = async (postId: number, status: 'published' | 'draft' | 'archived') => {
    try {
      await adminService.updatePostStatus(postId, status);
      message.success('Post status updated');
      fetchPosts();
    } catch (error) {
      message.error('Failed to update post');
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await adminService.deletePost(postId);
      message.success('Post deleted');
      fetchPosts();
    } catch (error) {
      message.error('Failed to delete post');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: AdminPost) => (
        <Link to={`/posts/${record.slug}`} target="_blank">
          {title}
        </Link>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      render: (author: AdminPost['author']) => author?.nickname || author?.username || '-',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: AdminPost['category']) => category?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : status === 'draft' ? 'blue' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_: any, record: AdminPost) => (
        <Space size="small">
          <span title="Views">{record.view_count} views</span>
          <span title="Likes">{record.like_count} likes</span>
          <span title="Comments">{record.comment_count} comments</span>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminPost) => (
        <Space size="small">
          <Select
            size="small"
            value={record.status}
            onChange={(v) => handleStatusChange(record.id, v as 'published' | 'draft' | 'archived')}
            options={[
              { value: 'published', label: 'Publish' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archive' },
            ]}
            style={{ width: 100 }}
          />
          <Link to={`/posts/${record.slug}`} target="_blank">
            <Button size="small" icon={<EyeOutlined />} />
          </Link>
          <Popconfirm
            title="Delete this post?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.managePage}>
      <h1 className={styles.title}>Post Management</h1>

      <div className={styles.filters}>
        <Search
          placeholder="Search posts..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
          style={{ width: 150 }}
        />
      </div>

      <Table
        dataSource={posts}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: size,
          onChange: setPage,
          showSizeChanger: false,
        }}
        className={styles.table}
      />
    </div>
  );
};

export default PostManagePage;

