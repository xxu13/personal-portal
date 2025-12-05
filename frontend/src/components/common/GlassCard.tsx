import { ReactNode, CSSProperties } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './GlassCard.module.scss';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

const GlassCard = ({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  style,
  ...motionProps
}: GlassCardProps) => {
  const paddingClass = padding !== 'none' ? styles[`padding-${padding}`] : '';
  const hoverClass = hoverable ? styles.hoverable : '';
  
  return (
    <motion.div
      className={`${styles.glassCard} ${paddingClass} ${hoverClass} ${className}`}
      style={style}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

