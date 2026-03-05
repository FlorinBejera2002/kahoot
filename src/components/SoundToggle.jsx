import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, initAudio } from '../utils/sounds';

export default function SoundToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) initAudio();
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      title={enabled ? 'Mute sounds' : 'Enable sounds'}
      aria-label={enabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {enabled ? <Volume2 size={20} className="text-gray-600 dark:text-gray-400" /> : <VolumeX size={20} className="text-gray-400 dark:text-gray-500" />}
    </button>
  );
}
