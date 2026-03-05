import { useState, useCallback } from 'react';
import { playClick } from '../utils/sounds';
import { tapLight } from '../utils/haptics';

const EMOJIS = [
  { emoji: '\uD83D\uDE0E', label: 'Cool' },
  { emoji: '\uD83D\uDE02', label: 'Funny' },
  { emoji: '\uD83E\uDD2F', label: 'Mind blown' },
  { emoji: '\uD83D\uDC4F', label: 'Clap' },
  { emoji: '\uD83D\uDD25', label: 'Fire' },
  { emoji: '\uD83C\uDF89', label: 'Party' },
];

export default function EmojiReactions({ className = '' }) {
  const [floating, setFloating] = useState([]);

  const handleEmoji = useCallback((emoji) => {
    playClick();
    tapLight();
    const id = Date.now() + Math.random();
    const x = Math.random() * 60 + 20;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== id));
    }, 1500);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {floating.map((f) => (
          <span
            key={f.id}
            className="absolute text-2xl animate-score-pop"
            style={{ left: `${f.x}%`, bottom: '100%' }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Emoji buttons */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {EMOJIS.map(({ emoji, label }) => (
          <button
            key={label}
            onClick={() => handleEmoji(emoji)}
            className="text-xl p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-transform"
            title={label}
            aria-label={`React with ${label}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
