import { supabase } from '../lib/supabase';

export async function getDefaultAvatarUrls() {
  const { data, error } = await supabase.storage
    .from('avatars')
    .list('defaults', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (error) throw error;

  return (data || [])
    .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name))
    .sort((a, b) => {
      const aMatch = a.name.match(/^default-(\d+)\./i);
      const bMatch = b.name.match(/^default-(\d+)\./i);
      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
      return a.name.localeCompare(b.name);
    })
    .map((file) => {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`defaults/${file.name}`);
      return publicUrlData.publicUrl;
    });
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
