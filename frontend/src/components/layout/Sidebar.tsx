import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Category, Tag } from '../../services/postService';
import categoryService from '../../services/categoryService';
import tagService from '../../services/tagService';
import GlassCard from '../common/GlassCard';
import styles from './Sidebar.module.scss';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, tags] = await Promise.all([
          categoryService.getAll(),
          tagService.getPopular(15),
        ]);
        setCategories(cats);
        setPopularTags(tags);
      } catch (error) {
        console.error('Failed to load sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryName = (cat: Category) => 
    i18n.language === 'en' ? cat.name_en : cat.name;

  const getTagName = (tag: Tag) => 
    (i18n.language === 'en' && tag.name_en) ? tag.name_en : tag.name;

  if (loading) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      {/* Categories */}
      {categories.length > 0 && (
        <GlassCard className={styles.widget}>
          <h3 className={styles.widgetTitle}>{t('nav.categories')}</h3>
          <ul className={styles.categoryList}>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link to={`/categories/${cat.slug}`} className={styles.categoryLink}>
                  {cat.icon && <span className={styles.categoryIcon}>{cat.icon}</span>}
                  <span className={styles.categoryName}>{getCategoryName(cat)}</span>
                  <span className={styles.categoryCount}>{cat.post_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <GlassCard className={styles.widget}>
          <h3 className={styles.widgetTitle}>{t('nav.tags')}</h3>
          <div className={styles.tagCloud}>
            {popularTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className={styles.tagLink}
              >
                #{getTagName(tag)}
              </Link>
            ))}
          </div>
        </GlassCard>
      )}
    </aside>
  );
};

export default Sidebar;

