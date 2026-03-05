import { useMemo } from 'react';
import { AVATAR_COLORS } from '../lib/constants';

function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-10 h-10 text-sm',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-[120px] h-[120px] text-4xl',
};

export default function Avatar({ src, name = '', size = 'sm', className = '' }) {
  const cls = SIZES[size] || SIZES.sm;
  const bg = useMemo(() => colorFromName(name), [name]);
  const initial = name.charAt(0).toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${cls} rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${cls} rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm ${className}`}
      style={{ backgroundColor: bg }}
      role="img"
      aria-label={`Avatar for ${name}`}
    >
      {initial}
    </div>
  );
}
