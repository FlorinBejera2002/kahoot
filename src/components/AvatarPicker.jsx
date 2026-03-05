import { useEffect, useState } from 'react';
import { Upload, Check } from 'lucide-react';
import Avatar from './Avatar';
import { getDefaultAvatarUrls, uploadAvatar } from '../utils/avatars';
import { playClick } from '../utils/sounds';
import { tapLight } from '../utils/haptics';
import toast from 'react-hot-toast';

export default function AvatarPicker({ value, onChange, name = 'You' }) {
  const [uploading, setUploading] = useState(false);
  const [defaults, setDefaults] = useState([]);

  useEffect(() => {
    let mounted = true;
    getDefaultAvatarUrls()
      .then((urls) => {
        if (mounted) setDefaults(urls);
      })
      .catch(() => {
        if (mounted) setDefaults([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (url) => {
    playClick();
    tapLight();
    onChange(url);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uid = `anon-${Date.now()}`;
      const url = await uploadAvatar(uid, file);
      onChange(url);
      toast.success('Avatar uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-3">
        <Avatar src={value} name={name} size="md" />
      </div>
      <div
        className="mb-3 max-h-72 overflow-y-auto pr-1"
        role="radiogroup"
        aria-label="Choose an avatar"
      >
        <div className="flex flex-wrap justify-between gap-y-3">
          {defaults.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => handleSelect(url)}
              role="radio"
              aria-checked={value === url}
              aria-label="Default avatar option"
              className={`relative w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all ${
                value === url ? 'border-primary scale-105 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
              {value === url && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <label className="btn-secondary text-sm cursor-pointer flex items-center justify-center gap-2 py-2">
        <Upload size={16} />
        {uploading ? 'Uploading...' : 'Upload Photo'}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
}
