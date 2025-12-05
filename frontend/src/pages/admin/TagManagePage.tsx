import { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { AdminTag, adminService } from '../../services/adminService';
import styles from './ManagePage.module.scss';

const { Search } = Input;

const TagManagePage = () => {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
  const [form] = Form.useForm();
  const size = 50;

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await adminService.getTags({
        page,
        size,
        search: search || undefined,
      });
      setTags(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [page, search]);

  const handleOpenModal = (tag: AdminTag) => {
    setEditingTag(tag);
    form.setFieldsValue(tag);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTag) {
        await adminService.updateTag(editingTag.id, values);
        message.success('Tag updated');
      }
      
      setModalOpen(false);
      fetchTags();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (tagId: number) => {
    try {
      await adminService.deleteTag(tagId);
      message.success('Tag deleted');
      fetchTags();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete tag');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Post Count',
      dataIndex: 'post_count',
      key: 'post_count',
      sorter: (a: AdminTag, b: AdminTag) => a.post_count - b.post_count,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminTag) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Delete this tag?"
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
      <h1 className={styles.title}>Tag Management</h1>

      <div className={styles.filters}>
        <Search
          placeholder="Search tags..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Table
        dataSource={tags}
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

      <Modal
        title="Edit Tag"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Update"
      >
        <Form form={form} layout="vertical" className={styles.form}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Tag name" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Slug is required' }]}
          >
            <Input placeholder="tag-slug" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TagManagePage;

