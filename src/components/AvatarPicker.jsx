import { useState, useMemo } from 'react';
import { Upload, Check } from 'lucide-react';
import Avatar from './Avatar';
import { getDefaultAvatarUrls, uploadAvatar } from '../utils/avatars';
import toast from 'react-hot-toast';

export default function AvatarPicker({ value, onChange, name = 'You' }) {
  const [uploading, setUploading] = useState(false);
  const defaults = useMemo(() => getDefaultAvatarUrls(), []);

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
      <div className="grid grid-cols-5 gap-2 mb-3">
        {defaults.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url)}
            className={`relative rounded-full overflow-hidden border-2 transition-all ${
              value === url ? 'border-primary scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img src={url} alt="" className="w-12 h-12 object-cover rounded-full" />
            {value === url && (
              <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      <label className="btn-secondary text-sm cursor-pointer flex items-center justify-center gap-2 py-2">
        <Upload size={16} />
        {uploading ? 'Uploading...' : 'Upload Photo'}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
}
