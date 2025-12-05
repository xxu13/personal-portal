import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, message, Space, Switch } from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import postService, { PostCreateData, PostUpdateData, Post } from '../../services/postService';
import categoryService from '../../services/categoryService';
import tagService from '../../services/tagService';
import { Category, Tag } from '../../services/postService';
import RichEditor, { RichEditorRef } from '../../components/editor/RichEditor';
import styles from './WritePage.module.scss';

const WritePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const editorRef = useRef<RichEditorRef>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);

  const isEditing = Boolean(id);
  
  // Suppress unused variable warning
  void initialLoading;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, tgs] = await Promise.all([
          categoryService.getAll(),
          tagService.getAll(),
        ]);
        setCategories(cats);
        setTags(tgs);

        if (id) {
          setInitialLoading(true);
          const postData = await postService.getById(Number(id));
          setPost(postData);
          form.setFieldsValue({
            title: postData.title,
            title_en: postData.title_en,
            excerpt: postData.excerpt,
            category_id: postData.category?.id,
            tag_ids: postData.tags.map(t => t.id),
          });
          editorRef.current?.setContent(postData.content);
        }
      } catch (error) {
        message.error('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id, form]);

  const handleSubmit = async (status: 'draft' | 'published') => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      const content = editorRef.current?.getJSON();

      if (!content) {
        message.error('Please enter content');
        return;
      }

      setSaving(true);

      let result: Post;
      if (isEditing && id) {
        const updateData: PostUpdateData = {
          title: values.title,
          title_en: values.title_en || undefined,
          content,
          excerpt: values.excerpt || undefined,
          category_id: values.category_id,
          tag_ids: values.tag_ids || [],
          status,
        };
        result = await postService.update(Number(id), updateData);
        message.success('Post updated');
      } else {
        const createData: PostCreateData = {
          title: values.title,
          title_en: values.title_en || undefined,
          content,
          excerpt: values.excerpt || undefined,
          category_id: values.category_id,
          tag_ids: values.tag_ids || [],
          status,
        };
        result = await postService.create(createData);
        message.success(status === 'published' ? 'Post published' : 'Draft saved');
      }

      navigate(`/posts/${result.slug}`);
    } catch (error) {
      console.error('Failed to save post:', error);
      message.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (cat: Category) =>
    i18n.language === 'en' ? cat.name_en : cat.name;

  const getTagName = (tag: Tag) =>
    (i18n.language === 'en' && tag.name_en) ? tag.name_en : tag.name;

  return (
    <div className={styles.writePage}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isEditing ? t('post.edit') : t('post.write')}
        </h1>
        <Space>
          <Button
            icon={<SaveOutlined />}
            onClick={() => handleSubmit('draft')}
            loading={saving}
          >
            {t('post.saveDraft')}
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSubmit('published')}
            loading={saving}
          >
            {t('post.publish')}
          </Button>
        </Space>
      </header>

      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          name="title"
          label={t('post.title')}
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder={t('post.title')} size="large" />
        </Form.Item>

        <div className={styles.toggleRow}>
          <span>Show English fields</span>
          <Switch checked={showEnglish} onChange={setShowEnglish} />
        </div>

        {showEnglish && (
          <Form.Item name="title_en" label="Title (English)">
            <Input placeholder="Title in English" size="large" />
          </Form.Item>
        )}

        <Form.Item label={t('post.content')}>
          <RichEditor
            ref={editorRef}
            content={post?.content}
            placeholder={t('post.content')}
            minHeight="400px"
          />
        </Form.Item>

        <div className={styles.metaRow}>
          <Form.Item name="category_id" label={t('post.category')} className={styles.metaItem}>
            <Select
              placeholder={t('post.category')}
              allowClear
              options={categories.map(cat => ({
                value: cat.id,
                label: getCategoryName(cat),
              }))}
            />
          </Form.Item>

          <Form.Item name="tag_ids" label={t('post.tags')} className={styles.metaItem}>
            <Select
              mode="multiple"
              placeholder={t('post.tags')}
              options={tags.map(tag => ({
                value: tag.id,
                label: getTagName(tag),
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="excerpt" label={t('post.excerpt')}>
          <Input.TextArea
            placeholder={t('post.excerpt')}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default WritePage;

