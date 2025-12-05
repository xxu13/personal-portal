import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import { Tag } from '../../services/postService';
import tagService from '../../services/tagService';
import GlassCard from '../../components/common/GlassCard';
import styles from './TagListPage.module.scss';

const TagListPage = () => {
  const { t, i18n } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await tagService.getPopular(50);
        setTags(data);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const getTagName = (tag: Tag) =>
    (i18n.language === 'en' && tag.name_en) ? tag.name_en : tag.name;

  // Calculate font size based on post count
  const maxCount = Math.max(...tags.map(t => t.post_count || 0), 1);
  const getFontSize = (count: number) => {
    const min = 0.875;
    const max = 1.5;
    return min + (count / maxCount) * (max - min);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('nav.tags')}</h1>

        <GlassCard className={styles.tagCloud}>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/posts?tag_id=${tag.id}`}
              className={styles.tag}
              style={{ fontSize: `${getFontSize(tag.post_count || 0)}rem` }}
            >
              #{getTagName(tag)}
              <span className={styles.count}>{tag.post_count}</span>
            </Link>
          ))}
        </GlassCard>
      </div>
    </div>
  );
};

export default TagListPage;

