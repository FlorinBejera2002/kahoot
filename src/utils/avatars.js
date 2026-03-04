import { supabase } from '../lib/supabase';
import { DEFAULT_AVATAR_COUNT } from '../lib/constants';

export function getDefaultAvatarUrls() {
  const urls = [];
  for (let i = 1; i <= DEFAULT_AVATAR_COUNT; i++) {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(`defaults/default-${i}.svg`);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadQuizImage(userId, file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('quiz-images')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('quiz-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
