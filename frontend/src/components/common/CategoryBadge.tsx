import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Category } from '../../services/postService';
import styles from './CategoryBadge.module.scss';

interface CategoryBadgeProps {
  category: Category;
  size?: 'small' | 'medium';
  clickable?: boolean;
}

const CategoryBadge = ({ category, size = 'medium', clickable = true }: CategoryBadgeProps) => {
  const { i18n } = useTranslation();
  const displayName = i18n.language === 'en' ? category.name_en : category.name;
  
  const badge = (
    <span className={`${styles.badge} ${styles[size]}`}>
      {category.icon && <span className={styles.icon}>{category.icon}</span>}
      {displayName}
    </span>
  );
  
  if (clickable) {
    return (
      <Link to={`/categories/${category.slug}`} className={styles.link}>
        {badge}
      </Link>
    );
  }
  
  return badge;
};

export default CategoryBadge;

