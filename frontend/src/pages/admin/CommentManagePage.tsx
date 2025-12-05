import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Switch, Button, Space, Popconfirm, message, Tag } from 'antd';
import { DeleteOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { AdminComment, adminService } from '../../services/adminService';
import styles from './ManagePage.module.scss';

const CommentManagePage = () => {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const size = 20;

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await adminService.getComments({
        page,
        size,
        is_deleted: showDeleted ? true : undefined,
      });
      setComments(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, showDeleted]);

  const handleDelete = async (commentId: number, hard = false) => {
    try {
      await adminService.deleteComment(commentId, hard);
      message.success(hard ? 'Comment permanently deleted' : 'Comment soft deleted');
      fetchComments();
    } catch (error) {
      message.error('Failed to delete comment');
    }
  };

  const handleRestore = async (commentId: number) => {
    try {
      await adminService.restoreComment(commentId);
      message.success('Comment restored');
      fetchComments();
    } catch (error) {
      message.error('Failed to restore comment');
    }
  };

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content_text',
      key: 'content_text',
      width: 300,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: AdminComment['user']) => user?.nickname || user?.username || '-',
    },
    {
      title: 'Post',
      dataIndex: 'post',
      key: 'post',
      render: (post: AdminComment['post']) =>
        post ? (
          <Link to={`/posts/${post.id}`} target="_blank">
            {post.title.length > 30 ? post.title.slice(0, 30) + '...' : post.title}
          </Link>
        ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      render: (isDeleted: boolean) => (
        <Tag color={isDeleted ? 'red' : 'green'}>
          {isDeleted ? 'Deleted' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Likes',
      dataIndex: 'like_count',
      key: 'like_count',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminComment) => (
        <Space size="small">
          {record.is_deleted ? (
            <>
              <Button
                size="small"
                icon={<UndoOutlined />}
                onClick={() => handleRestore(record.id)}
              >
                Restore
              </Button>
              <Popconfirm
                title="Permanently delete?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.id, true)}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              title="Delete this comment?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.managePage}>
      <h1 className={styles.title}>Comment Management</h1>

      <div className={styles.filters}>
        <span>Show deleted only:</span>
        <Switch
          checked={showDeleted}
          onChange={(v) => { setShowDeleted(v); setPage(1); }}
        />
      </div>

      <Table
        dataSource={comments}
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

export default CommentManagePage;

