import { useEffect, useState } from 'react';
import { Table, Input, Select, Switch, Space, message, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { AdminUser, adminService } from '../../services/adminService';
import styles from './ManagePage.module.scss';

const { Search } = Input;

const UserManagePage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const size = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        page,
        size,
        search: search || undefined,
        role: roleFilter,
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await adminService.updateUser(userId, { role });
      message.success('User role updated');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleActiveChange = async (userId: number, isActive: boolean) => {
    try {
      await adminService.updateUser(userId, { is_active: isActive });
      message.success(isActive ? 'User activated' : 'User deactivated');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: AdminUser) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>{record.nickname || record.username}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              @{record.username}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: AdminUser) => (
        <Select
          value={role}
          onChange={(v) => handleRoleChange(record.id, v)}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
          style={{ width: 100 }}
          size="small"
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: AdminUser) => (
        <Switch
          checked={isActive}
          onChange={(v) => handleActiveChange(record.id, v)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div className={styles.managePage}>
      <h1 className={styles.title}>User Management</h1>

      <div className={styles.filters}>
        <Search
          placeholder="Search users..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          allowClear
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
          style={{ width: 150 }}
        />
      </div>

      <Table
        dataSource={users}
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

export default UserManagePage;

