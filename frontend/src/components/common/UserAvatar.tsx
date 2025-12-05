import { Avatar, AvatarProps } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string | null;
  username?: string;
  size?: number | 'small' | 'default' | 'large';
}

/**
 * User avatar component with fallback to initials or icon.
 */
const UserAvatar = ({ 
  src, 
  username, 
  size = 'default',
  style,
  ...props 
}: UserAvatarProps) => {
  // Get initials from username
  const getInitials = (name?: string) => {
    if (!name) return null;
    return name.charAt(0).toUpperCase();
  };
  
  // Generate a consistent color based on username
  const getColorFromName = (name?: string) => {
    if (!name) return 'var(--accent-primary)';
    
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#22d3ee', // cyan
      '#f472b6', // pink
      '#22c55e', // green
      '#f59e0b', // amber
      '#3b82f6', // blue
    ];
    
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };
  
  // If there's a valid avatar URL, use it
  if (src) {
    return (
      <Avatar
        src={src}
        size={size}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          ...style,
        }}
        {...props}
      />
    );
  }
  
  // If there's a username, show initials
  if (username) {
    return (
      <Avatar
        size={size}
        style={{
          backgroundColor: getColorFromName(username),
          color: '#fff',
          fontWeight: 600,
          ...style,
        }}
        {...props}
      >
        {getInitials(username)}
      </Avatar>
    );
  }
  
  // Fallback to user icon
  return (
    <Avatar
      icon={<UserOutlined />}
      size={size}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        ...style,
      }}
      {...props}
    />
  );
};

export default UserAvatar;


