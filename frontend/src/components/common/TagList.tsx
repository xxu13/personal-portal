import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag } from '../../services/postService';
import styles from './TagList.module.scss';

interface TagListProps {
  tags: Tag[];
  max?: number;
  size?: 'small' | 'medium';
  clickable?: boolean;
}

const TagList = ({ tags, max, size = 'medium', clickable = true }: TagListProps) => {
  const { i18n } = useTranslation();
  const displayTags = max ? tags.slice(0, max) : tags;
  const remaining = max ? tags.length - max : 0;
  
  const getDisplayName = (tag: Tag) => {
    if (i18n.language === 'en' && tag.name_en) {
      return tag.name_en;
    }
    return tag.name;
  };
  
  return (
    <div className={`${styles.tagList} ${styles[size]}`}>
      {displayTags.map((tag) => (
        clickable ? (
          <Link
            key={tag.id}
            to={`/tags/${tag.slug}`}
            className={styles.tag}
          >
            #{getDisplayName(tag)}
          </Link>
        ) : (
          <span key={tag.id} className={styles.tag}>
            #{getDisplayName(tag)}
          </span>
        )
      ))}
      {remaining > 0 && (
        <span className={styles.more}>+{remaining}</span>
      )}
    </div>
  );
};

export default TagList;

